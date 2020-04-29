import {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent
} from "https://deno.land/std@v0.41.0/ws/mod.ts";
import * as log from "https://deno.land/std@v0.41.0/log/mod.ts";
import { equal } from "https://deno.land/std@v0.41.0/bytes/mod.ts";
import { Gateway } from "../@types/denocord.ts";
import { Z_SYNC_FLUSH } from "../lib/constants.ts";
import Client from "../Client.ts";
import pako from "https://raw.githubusercontent.com/Denocord/pako/master/mod.js";
import Bucket from "../lib/Bucket.ts";
await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG")
  },
  loggers: {
    denocord: {
      level: "DEBUG",
      handlers: ["console"]
    }
  }
});

const logger = log.getLogger("denocord");
const debug = logger.debug.bind(logger);
//const debug = createDebug("denocord:WebsocketShard");
//const debug = (...args: unknown[]) => Deno.env().DENOCORD_DEBUG ? console.log(...args) : "";

class WebsocketShard {
  public socket!: WebSocket;
  public status: Gateway.GatewayStatus = "connecting";
  private heartbeat?: number;
  private heartbeatAck = true;
  private failedHeartbeatAck = 0;
  private seq: number | null = null;
  private textDecoder = new TextDecoder("utf-8");
  private sessionID?: string;
  // @ts-ignore
  private deflator: any = new pako.Inflate({
    chunkSize: 128 * 1024
  });
  private globalBucket: Bucket = new Bucket(120, 60000);
  private presenceUpdateBucket: Bucket = new Bucket(5, 60000);

  public constructor(private token: string, private client: Client) {}

  public async connect(): Promise<void> {
    try {
      this.socket = await connectWebSocket(this.client.gatewayURL);
      await this.onOpen();
      for await (const payload of this.socket.receive()){
        if (payload instanceof Uint8Array) {
          let data: Uint8Array;
          if (this.client.options.compress) {
            // @ts-ignore
            data = pako.inflate(payload);

            try {
              const json = this.textDecoder.decode(data);
              const packet = JSON.parse(json);
              await this.handlePacket(packet);
            } catch (err) {
              console.error(err);
            }
          } else if (this.client.options.compressStream) {
            if (
              payload.length >= 4 &&
              equal(payload.slice(payload.length - 4), Z_SYNC_FLUSH)
            ) {
              // @ts-ignore
              this.deflator.push(payload, pako.Z_SYNC_FLUSH);
              if (this.deflator.err) {
                console.warn("DEFLATE ERROR", this.deflator.err);
                continue;
              }
              data = this.deflator.result;
              try {
                const json = this.textDecoder.decode(data);
                const packet = JSON.parse(json);
                await this.handlePacket(packet);
              } catch (err) {
                console.error(err);
              }
            } else {
              this.deflator.push(payload, false);
              continue;
            }
          } else {
            console.warn("WTF: Got binary data without compression enabled");
            continue;
          }
        } else if (isWebSocketCloseEvent(payload)) {
          this.client.removeAllListeners();
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
    let isResuming = this.status === "resuming";
    this.status = "handshaking";
    debug("Started handshaking.");
    await this.sendHeartbeat();
    await this.identifyClient();
    if (isResuming) {
      await this.send(Gateway.OP_CODES.RESUME, {
        token: this.token,
        session_id: this.sessionID,
        seq: this.seq
      });
    }
  }

  private async onClose(closeData: WebSocketCloseEvent): Promise<void | never> {
    await this.close();
    debug(
      `Disconnected with code ${closeData.code} for reason:\n${closeData.reason}`
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
      UNKNOWN_OP_CODE
    } = Gateway.CLOSE_CODES;
    if (closeData.code === INVALID_INTENTS 
      || closeData.code === DISALLOWED_INTENTS) {
        throw new Error("Invalid and/or disallowed gateway intents were provided");
      }
    if (closeData.code === AUTHENTICATION_FAILED) {
      throw new Error("Invalid token");
    }
    if (closeData.code === UNKNOWN_OP_CODE) {
      throw new Error("An unknown op code was sent. This shouldn't happen - please report this at https://github.com/Denocord/Denocord.")
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
  }

  private async handlePacket(
    packet: Gateway.GatewayPacket
  ): Promise<void | never> {
    this.seq = packet.s;
    if (packet.op === Gateway.OP_CODES.HELLO) {
      this.setHeartbeat(packet.d.heartbeat_interval);
    } else if (packet.op === Gateway.OP_CODES.HEARTBEAT_ACK) {
      this.heartbeatAck = true;
      debug("Received heartbeat ack.");
    } else if (packet.op === Gateway.OP_CODES.RECONNECT) {
      // Discord is sending reconnect packets every n
      this.status = "resuming";
      await this.close();
      await this.connect();
    }
    if (packet.op === Gateway.OP_CODES.DISPATCH) {
      if (packet.t === "READY") {
        this.status = "ready";
        this.sessionID = packet.d.session_id;
      }
      debug(`Received dispatch event: ${packet.t}.`);
      this.client.emit(packet.t as Gateway.DispatchEvents, packet.d);
    }
  }

  private setHeartbeat(interval: number): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    debug(`Heartbeat interval was set to ${interval}ms.`);
    this.heartbeat = setInterval(this.sendHeartbeat.bind(this), interval);
  }

  private send(op: Gateway.OP_CODES, data: any, priority: boolean = false): Promise<void> {
    return new Promise((rs, rj) => {
      let i = 0;
      let wait = 1;
      const func = () => {
        const d = JSON.stringify({
          op,
          d: data
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

  private async sendHeartbeat(): Promise<void> {
    debug(`Sending heartbeat.`);
    if (!this.heartbeatAck) {
      this.failedHeartbeatAck++;
      debug("Did not receive heartbeat ACK before next heartbeat!");
      if (this.status === "ready") {
        this.status = "resuming";
        await this.close();
        await this.connect();
        return;
      } else if (this.status === "handshaking" && this.failedHeartbeatAck > 2) {
        await this.close(1014);
        this.client.removeAllListeners();
        throw new Error("Failed to receive heartbeat after 3 attempts!");
      }
    }

    this.heartbeatAck = false;
    await this.send(Gateway.OP_CODES.HEARTBEAT, this.seq, true);
    debug("Heartbeat sent.");
  }

  public async close(code = 1000): Promise<void> {
    this.failedHeartbeatAck = 0;
    this.heartbeatAck = true;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (!this.socket.isClosed) this.socket.close(code);
  }

  private identifyClient(): Promise<void> {
    debug("Identifying client.");
    return this.send(Gateway.OP_CODES.IDENTIFY, {
      token: this.token,
      compress: !!this.client.options.compress,
      properties: {
        $os: Deno.build.os,
        $browser: "Denocord",
        $device: "Denocord"
      },
      intents: this.client.options.intents
    });
  }

  public async sendActivity(activity: object): Promise<void> {
    await this.send(Gateway.OP_CODES.STATUS_UPDATE, activity);
  }
}

export default WebsocketShard;
