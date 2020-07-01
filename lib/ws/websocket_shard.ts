import { EventEmitter, StrictEventEmitter } from "../deps.ts";
import { bus, setToken, state } from "../client.ts";
import { Gateway, DataTypes, DATA_SYMBOL } from "../@types/denocord.ts";
import { Z_SYNC_FLUSH } from "../util/constants.ts";
import Bucket from "../util/Bucket.ts";
import RequestHandler from "../rest/request_handler.ts";
import createObject from "../util/create_object.ts";
import {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent,
  equal,
  pako,
  decompressor,
} from "../deps.ts";
import ExtendedUser from "../structures/ExtendedUser.ts";

type WebsocketEvents = {
  raw: string;
  message: { messageStub: true };
  ready: void;
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
  intents?: Gateway.GatewayIntents;
}

class WebsocketShard extends (EventEmitter as StrictEECtor) {
  private gatewayURL?: string;
  public token?: string;
  public options: WSOptions = {
    compress: CompressionOptions.NONE,
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
    //@ts-ignore
    if (
      this.options.compress === CompressionOptions.ZLIB_STREAM &&
      typeof Deno.openPlugin !== "function"
    ) {
      console.warn(
        " !!! Using zlib-stream compression is done through an unstable API.  !!!",
      );
      console.warn(
        " !!! Please, run Deno with the --unstable flag. Until then, Denocord !!!",
      );
      console.warn(
        " !!! will use packet-based zlib compression instead.                 !!!",
      );
      this.options.compress = CompressionOptions.ZLIB;
    }

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
      this.gatewayURL = `${url}?v=6&encoding=json${
        this.options.compress === CompressionOptions.ZLIB_STREAM
          ? `&compress=zlib-stream`
          : ""
      }`;
    }
  }
  public configure(options: WSOptions) {
    this.options = options;
  }

  private async connect() {
    console.log("connecting");
    if (!this.gatewayURL) {
      await this.discoverWS();
    }
    try {
      decompressor.reset();
      this.socket = await connectWebSocket(this.gatewayURL!);
      await this.onOpen();
      for await (const payload of this.socket) {
        if (payload instanceof Uint8Array) {
          let data: Uint8Array;
          if (this.options.compress === CompressionOptions.ZLIB) {
            // @ts-ignore
            data = pako.inflate(payload);
          } else if (this.options.compress === CompressionOptions.ZLIB_STREAM) {
            if (
              payload.length >= 4 &&
              equal(payload.slice(payload.length - 4), Z_SYNC_FLUSH)
            ) {
              // @ts-ignore
              decompressor.push(payload, true);
              // @ts-ignore
              data = decompressor.res;
            } else {
              // @ts-ignore
              decompressor.push(payload);
              continue;
            }
          } else {
            console.warn("WTF: Got binary data without compression enabled");
            continue;
          }
          try {
            //@ts-ignore
            const json = this.textDecoder.decode(data);
            const packet = JSON.parse(json);
            await this.handlePacket(packet);
          } catch (err) {
            bus.emit("error", err);
          }
        } else if (isWebSocketCloseEvent(payload)) {
          await this.onClose(payload);
          break;
        } else if (typeof payload === "string") {
          const packet = JSON.parse(payload);
          await this.handlePacket(packet);
        }
      }
    } catch (err) {
      console.error(err.stack);
      if (this.socket) this.close(1011);
      throw err;
    }
  }
  private async onOpen(): Promise<void> {
    const isResuming = this.status === "resuming";
    this.status = "handshaking";
    this.debug("Started handshaking.");
    if (isResuming) {
      await this.send(Gateway.OP_CODES.RESUME, {
        token: this.token,
        session_id: this.sessionID,
        seq: this.seq,
      });
    } else {
      await this.sendHeartbeat();
      await this.identifyClient();
    }
  }
  private async onClose(closeData: WebSocketCloseEvent): Promise<void | never> {
    await this.close();
    this.debug(
      `Disconnected with code ${closeData.code} for reason:\n${closeData.reason}`,
    );
    this.status = "disconnected";
    const {
      UNKNOWN_ERROR,
      INVALID_SEQ,
      RATE_LIMITED,
      SESSION_TIMEOUT,
      INVALID_INTENTS,
      DISALLOWED_INTENTS,
      AUTHENTICATION_FAILED,
      UNKNOWN_OP_CODE,
    } = Gateway.CLOSE_CODES;
    if (
      closeData.code === INVALID_INTENTS ||
      closeData.code === DISALLOWED_INTENTS
    ) {
      throw new Error(
        "Invalid and/or disallowed gateway intents were provided",
      );
    }
    if (closeData.code === AUTHENTICATION_FAILED) {
      throw new Error("Invalid token");
    }
    if (closeData.code === UNKNOWN_OP_CODE) {
      throw new Error(
        "An unknown op code was sent. This shouldn't happen - please report this at https://github.com/Denocord/Denocord.",
      );
    }
    if (
      (this.sessionID && closeData.code === UNKNOWN_ERROR) ||
      closeData.code === INVALID_SEQ ||
      closeData.code === RATE_LIMITED ||
      closeData.code === SESSION_TIMEOUT
    ) {
      this.status = "resuming";
      await this.connect();
    }
    throw new Error(`${closeData.code}: ${closeData.reason}`);
  }

  private async handlePacket(
    packet: Gateway.GatewayPacket,
  ): Promise<void | never> {
    this.seq = packet.s;
    if (packet.op === Gateway.OP_CODES.HELLO) {
      this.setHeartbeat(packet.d.heartbeat_interval);
    } else if (packet.op === Gateway.OP_CODES.HEARTBEAT_ACK) {
      this.heartbeatAck = true;
      this.debug("Received heartbeat ack.");
    } else if (packet.op === Gateway.OP_CODES.RECONNECT) {
      // Discord is sending reconnect packets every n
      this.status = "resuming";
      await this.close();
      await this.connect();
    } else if (packet.op === Gateway.OP_CODES.DISPATCH) {
      this.debug(`Received dispatch event: ${packet.t}.`);
      this.dispatch(packet);
      //this.emit(packet.t as Gateway.DispatchEvents, packet.d);
    } else if (packet.op === Gateway.OP_CODES.INVALID_SESSION) {
      if (packet.d) {
        this.status = "resuming";
      } else {
        this.sessionID = undefined;
        this.status = "disconnected";
      }
      await this.close();
      setTimeout(
        async () => await this.connect(),
        Math.floor(Math.random() * 5000),
      );
    } else if (packet.op === Gateway.OP_CODES.HEARTBEAT) {
      await this.sendHeartbeat(true);
    }
  }

  private dispatch(payload: Gateway.GatewayPacket) {
    switch (payload.t) {
      case "READY":
      case "RESUMED": {
        this.sessionID = payload.d.session_id;
        (<any> state).user = createObject<ExtendedUser>(
          payload.d.user,
          DataTypes.USER,
        );
        (<any> state).guilds = new Map(
          payload.d.guilds.map((g: any) => [
            g.id,
            g.unavailable
              ? { ...g, [DATA_SYMBOL]: DataTypes.GUILD }
              : createObject(g, DataTypes.GUILD),
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
        state.guilds.set(payload.d.id, payload.d);
        if (this.status === "ready") {
          if (oldGuild.unavailable === false) {
            this.emit("guildCreate", payload.d);
          }
        }
      }
    }
  }

  private setHeartbeat(interval: number): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.debug(`Heartbeat interval was set to ${interval}ms.`);
    this.heartbeat = setInterval(this.sendHeartbeat.bind(this), interval);
  }

  private send(
    op: Gateway.OP_CODES,
    data: any,
    priority: boolean = false,
  ): Promise<void> {
    return new Promise((rs, rj) => {
      let i = 0;
      let wait = 1;
      const func = () => {
        const d = JSON.stringify({
          op,
          d: data,
        });
        if (++i >= wait) {
          this.socket.send(d).then(rs, rj);
        }
      };

      if (op === Gateway.OP_CODES.STATUS_UPDATE) {
        wait++;
        this.presenceUpdateBucket.add(func, priority);
      }
      this.globalBucket.add(func, priority);
    });
  }

  private async sendHeartbeat(forced = false): Promise<void> {
    this.debug(`Sending heartbeat.`);
    if (!forced && !this.heartbeatAck) {
      this.failedHeartbeatAck++;
      this.debug("Did not receive heartbeat ACK before next heartbeat!");
      if (this.status === "ready") {
        this.status = "resuming";
        await this.close(1014);
        await this.connect();
        return;
      } else if (this.status === "handshaking" && this.failedHeartbeatAck > 2) {
        await this.close(1014);
        // TODO: this should not panic?
        throw new Error("Failed to receive heartbeat after 3 attempts!");
      }
    }

    this.heartbeatAck = false;
    await this.send(Gateway.OP_CODES.HEARTBEAT, this.seq, true);
    this.debug("Heartbeat sent.");
  }

  public async close(code = 1000): Promise<void> {
    this.failedHeartbeatAck = 0;
    this.heartbeatAck = true;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (!this.socket.isClosed) this.socket.close(code);
  }

  private identifyClient(): Promise<void> {
    this.debug("Identifying client.");
    return this.send(Gateway.OP_CODES.IDENTIFY, {
      token: this.token,
      compress: this.options.compress !== CompressionOptions.NONE,
      properties: {
        $os: Deno.build.os,
        $browser: "Denocord",
        $device: "Denocord",
      },
      intents: this.options.intents,
    });
  }
}

export default WebsocketShard;
