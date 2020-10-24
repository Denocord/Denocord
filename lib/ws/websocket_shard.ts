import { EventEmitter, StrictEventEmitter, APITypes } from "../deps.ts";
import { bus, setToken, state } from "../client.ts";
import type { Gateway } from "../@types/denocord.ts";
import { Z_SYNC_FLUSH, API_WS_VERSION } from "../util/constants.ts";
import Bucket from "../util/Bucket.ts";
import RequestHandler from "../rest/request_handler.ts";
import createObject from "../util/create_object.ts";
import {
  equal,
  inflate,
  decompressor,
} from "../deps.ts";
type WebsocketEvents = {
  // TODO(TTtie): Is this used?
  raw: string;

  /**
   * The event emitted once the message gets created
   */
  message: APITypes.Message;

  /**
   * The event emitted once the bot is ready
   */
  ready: void;

  /**
   * The event emitted when a guild is created
   */
  guildCreate: APITypes.Guild;

  /**
   * The event emitted when a guild is deleted
   */
  guildDelete: APITypes.Guild | {
    id: string;
    [APITypes.DATA_SYMBOL]: APITypes.DataTypes.GUILD;
  };

  /**
   * The event emitted when a guild is updated. All properties are guaranteed to be available.
   */
  guildUpdate: (
    newGuildData: Partial<APITypes.Guild>,
    old?: APITypes.Guild,
  ) => void;
  // TODO(zorbyte): how do I make it use Gateway.DispatchEvents? - TTtie
  [k: string]: any;
};

type StrictEECtor = {
  new (): StrictEventEmitter<EventEmitter, WebsocketEvents>;
};

export enum CompressionOptions {
  ZLIB_STREAM,
  ZLIB,
  NONE,
}

export interface WSOptions {
  compress?: CompressionOptions;
  intents: APITypes.GatewayIntentBits;
  shardID?: number;
  shardCount?: number;
}

class WebsocketShard extends (EventEmitter as StrictEECtor) {
  private gatewayURL?: string;
  public token?: string;
  public options: WSOptions = {
    compress: CompressionOptions.NONE,
    intents: 0,
    shardID: 0,
    shardCount: 1,
  };

  public socket!: WebSocket;
  public status: Gateway.GatewayStatus = "connecting";
  private heartbeat?: number;
  private heartbeatAck = true;
  private failedHeartbeatAck = 0;
  private seq: number | null = null;
  private textDecoder = new TextDecoder("utf-8");
  private sessionID?: string;
  private globalBucket: Bucket = new Bucket(120, 60000);
  private presenceUpdateBucket: Bucket = new Bucket(5, 60000);

  private static instance: WebsocketShard;

  public static get() {
    return this.instance ?? (this.instance = new WebsocketShard());
  }

  // This redundant constructor ensures that it can not be initialised with new.
  private constructor() {
    super();
  }

  private debug(msg: string) {
    bus.emit("debug", msg);
  }

  public async login(token: string) {
    bus.emit("debug", "Logging in.");
    this.token = token;
    setToken(token);
    await this.connect();
  }

  private async discoverWS() {
    const { url, session_start_limit: ssl } = await RequestHandler.get()
      .request("GET", "/gateway/bot");
    this.debug("found gateway");
    if (!ssl.remaining) {
      throw new Error(
        `Starting the bot would reset the token. Please restart the bot after ${ssl.reset_after}ms`,
      );
    }
    if (!this.gatewayURL) {
      this.gatewayURL = `${url}?v=${API_WS_VERSION}&encoding=json${
        this.options.compress === CompressionOptions.ZLIB_STREAM
          ? "&compress=zlib-stream"
          : ""
      }`;
    }
  }
  public configure(options: Partial<WSOptions>) {
    Object.assign(this.options, options);
    // TODO(TTtie): should this be obj.assign like in djs, eris and co or set props as they are?
    // this.options = options;
  }

  private async connect() {
    console.log("connecting");
    if (!this.gatewayURL) {
      await this.discoverWS();
    }
    try {
      if (this.options.compress === CompressionOptions.ZLIB_STREAM) {
        decompressor.reset();
      }
      await new Promise((_, rj) => {
        this.socket = new WebSocket(this.gatewayURL!);
        this.socket.addEventListener("error", (err) => {
          rj(err);
        });
        this.socket.addEventListener("open", () => {
          this.onOpen().catch(rj);
        });
        this.socket.addEventListener("message", (m) => {
          const payload = m.data;
          this.onMessage(payload).catch(rj);
        });
        this.socket.addEventListener("close", (ev) => {
          this.onClose(ev).catch(rj);
        });
      });
    } catch (err) {
      console.error(err.stack);
      if (this.socket) this.close(1011);
      throw err;
    }
  }

  private async onMessage(received: unknown) {
    if (received instanceof Blob) {
      let data: Uint8Array;
      const buf = new Uint8Array(await received.arrayBuffer());
      if (this.options.compress === CompressionOptions.ZLIB) {
        data = inflate(buf);
      } else if (this.options.compress === CompressionOptions.ZLIB_STREAM) {
        if (
          buf.length >= 4 &&
          equal(buf.slice(buf.length - 4), Z_SYNC_FLUSH)
        ) {
          decompressor.push(buf, true);
          data = decompressor.res!;
        } else {
          decompressor.push(buf);
          return;
        }
      } else {
        console.warn("WTF: Got binary data without compression enabled");
        return;
      }
      try {
        const json = this.textDecoder.decode(data);
        const packet = JSON.parse(json);
        await this.handlePacket(packet);
      } catch (err) {
        bus.emit("error", err);
      }
    } else if (typeof received === "string") {
      const packet = JSON.parse(received);
      await this.handlePacket(packet);
    }
  }

  private async onOpen(): Promise<void> {
    const isResuming = this.status === "resuming";
    this.status = "handshaking";
    this.debug("Started handshaking.");
    if (isResuming) {
      await this.send(APITypes.GatewayOPCodes.Resume, {
        token: this.token,
        session_id: this.sessionID,
        seq: this.seq,
      });
    } else {
      await this.sendHeartbeat();
      await this.identifyClient();
    }
  }
  private async onClose(closeData: CloseEvent): Promise<void | never> {
    await this.close();
    this.debug(
      `Disconnected with code ${closeData.code} for reason:\n${closeData.reason}`,
    );
    this.status = "disconnected";
    const {
      UnknownError,
      InvalidSeq,
      RateLimited,
      SessionTimedOut,
      InvalidIntents,
      DisallowedIntents,
      AuthenticationFailed,
      UnknownOpCode,
    } = APITypes.GatewayCloseCodes;
    if (
      closeData.code === InvalidIntents ||
      closeData.code === DisallowedIntents
    ) {
      throw new Error(
        "Invalid and/or disallowed gateway intents were provided",
      );
    }
    if (closeData.code === AuthenticationFailed) {
      throw new Error("Invalid token");
    }
    if (closeData.code === UnknownOpCode) {
      throw new Error(
        "An unknown op code was sent. This shouldn't happen - please report this at https://github.com/Denocord/Denocord.",
      );
    }
    if (
      (this.sessionID && closeData.code === UnknownError) ||
      closeData.code === InvalidSeq ||
      closeData.code === RateLimited ||
      closeData.code === SessionTimedOut
    ) {
      this.status = "resuming";
      await this.connect();
    }
    throw new Error(`${closeData.code}: ${closeData.reason}`);
  }

  private async handlePacket(
    packet: APITypes.GatewayReceivePayload,
  ): Promise<void | never> {
    this.seq = packet.s;
    if (packet.op === APITypes.GatewayOPCodes.Hello) {
      this.setHeartbeat(packet.d.heartbeat_interval);
    } else if (packet.op === APITypes.GatewayOPCodes.HeartbeatAck) {
      this.heartbeatAck = true;
      this.debug("Received heartbeat ack.");
    } else if (packet.op === APITypes.GatewayOPCodes.Reconnect) {
      // Discord is sending reconnect packets every n
      this.status = "resuming";
      this.close();
      await this.connect();
    } else if (packet.op === APITypes.GatewayOPCodes.Dispatch) {
      this.debug(`Received dispatch event: ${packet.t}.`);
      this.dispatch(packet);
      //this.emit(packet.t as Gateway.DispatchEvents, packet.d);
    } else if (packet.op === APITypes.GatewayOPCodes.InvalidSession) {
      if (packet.d) {
        this.status = "resuming";
      } else {
        this.sessionID = undefined;
        this.status = "disconnected";
      }
      this.close();
      setTimeout(
        async () => await this.connect(),
        Math.floor(Math.random() * 5000),
      );
    } else if (packet.op === APITypes.GatewayOPCodes.Heartbeat) {
      this.sendHeartbeat(true);
    }
  }

  private dispatch(payload: APITypes.GatewayDispatchPayload) {
    switch (payload.t) {
      case "READY":
      case "RESUMED": {
        this.sessionID = payload.d.session_id;
        (<any> state).user = createObject(
          payload.d.user,
          APITypes.DataTypes.USER,
        );
        (<any> state).guilds = new Map(
          payload.d.guilds.map((
            g: APITypes.APIUnavailableGuild | APITypes.APIGuild,
          ) => [
            g.id,
            g.unavailable
              ? { ...g, [APITypes.DATA_SYMBOL]: APITypes.DataTypes.GUILD }
              : createObject(
                <APITypes.APIGuild> g,
                APITypes.DataTypes.GUILD,
              ),
          ]),
        );
        setTimeout(() => {
          this.status = "ready";
          this.emit("ready");
        }, 2000);
        break;
      }

      case "GUILD_CREATE": {
        const oldGuild = state.guilds.get(payload.d.id);
        const guild = createObject(payload.d, APITypes.DataTypes.GUILD);
        state.guilds.set(payload.d.id, guild);
        if (this.status === "ready") {
          if (!oldGuild || oldGuild?.unavailable === false) {
            this.emit("guildCreate", guild);
          }
        }
        break;
      }

      case "GUILD_DELETE": {
        const oldGuild: APITypes.Guild = <APITypes.Guild> state.guilds.get(
          payload.d.id,
        );
        if (typeof payload.d.unavailable !== "undefined") { // Guild becomes N/A
          state.guilds.set(payload.d.id, {
            ...(oldGuild || {}),
            ...payload.d,
            [APITypes.DATA_SYMBOL]: APITypes.DataTypes.GUILD,
          });
          break;
        }

        if (oldGuild) {
          state.guilds.delete(payload.d.id);
          this.emit("guildDelete", oldGuild);
        } else {
          this.emit("guildDelete", {
            id: payload.d.id,
            [APITypes.DATA_SYMBOL]: APITypes.DataTypes.GUILD,
          });
        }
        break;
      }

      case "GUILD_UPDATE": {
        // TODO(TTtie): Do they really send a full guild?
        const oldGuild = <APITypes.Guild> state.guilds.get(
          (<any> payload.d).guild_id,
        );
        if (!oldGuild) {
          this.emit(
            "guildUpdate",
            createObject(payload.d, APITypes.DataTypes.GUILD),
          );
        } else {
          const oldGuildCopy = { ...oldGuild };
          delete (<any> payload.d).guild_id;
          const newGuild = createObject(payload.d, APITypes.DataTypes.GUILD);
          Object.assign(oldGuild, newGuild);
          this.emit("guildUpdate", oldGuild, oldGuildCopy);
        }
        break;
      }

      case "MESSAGE_CREATE": {
        const msg = createObject(payload.d, APITypes.DataTypes.MESSAGE);
        this.emit("message", msg);
        break;
      }
    }
  }

  private setHeartbeat(interval: number): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.debug(`Heartbeat interval was set to ${interval}ms.`);
    this.heartbeat = setInterval(this.sendHeartbeat.bind(this), interval);
  }

  private send(
    op: APITypes.GatewayOPCodes,
    data: any,
    priority: boolean = false,
  ) {
    let i = 0;
    let wait = 1;
    const func = () => {
      const d = JSON.stringify({
        op,
        d: data,
      });
      if (++i >= wait) {
        this.socket.send(d);
      }
    };

    if (op === APITypes.GatewayOPCodes.PresenceUpdate) {
      wait++;
      this.presenceUpdateBucket.add(func, priority);
    }
    this.globalBucket.add(func, priority);
  }

  private async sendHeartbeat(forced = false): Promise<void> {
    this.debug(`Sending heartbeat.`);
    if (!forced && !this.heartbeatAck) {
      this.failedHeartbeatAck++;
      this.debug("Did not receive heartbeat ACK before next heartbeat!");
      if (this.status === "ready") {
        this.status = "resuming";
        this.close(1014);
        await this.connect();
        return;
      } else if (this.status === "handshaking" && this.failedHeartbeatAck > 2) {
        this.close(1014);
        // TODO: this should not panic?
        throw new Error("Failed to receive heartbeat after 3 attempts!");
      }
    }

    this.heartbeatAck = false;
    this.send(APITypes.GatewayOPCodes.Heartbeat, this.seq, true);
    this.debug("Heartbeat sent.");
  }

  public close(code = 1000) {
    this.failedHeartbeatAck = 0;
    this.heartbeatAck = true;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.socket.readyState !== WebSocket.CLOSED) this.socket.close(code);
  }

  private identifyClient() {
    this.debug("Identifying client.");
    this.send(APITypes.GatewayOPCodes.Identify, {
      token: this.token,
      compress: this.options.compress !== CompressionOptions.NONE,
      properties: {
        $os: Deno.build.os,
        $browser: "Denocord",
        $device: "Denocord",
      },
      intents: this.options.intents,
      shard: [this.options.shardID || 0, this.options.shardCount || 1],
    });
  }
}

export default WebsocketShard;
