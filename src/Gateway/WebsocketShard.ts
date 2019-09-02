import {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent
} from "https://deno.land/std@v0.16.0/ws/mod.ts";
import createDebug from "https://deno.land/x/debuglog/debug.ts";
import { GATEWAY_URI } from "../lib/constants.ts";
import { Gateway } from "../@types/dencord.ts";
import Client from "../Client.ts";
import { UnexpectedEOFError } from "../../../../../Library/Caches/deno/deps/https/deno.land/std@v0.16.0/io/bufio.ts";

const debug = createDebug("dencord:WebsocketShard");

class WebsocketShard {
  public socket!: WebSocket;
  public status: Gateway.GatewayStatus = "connecting";
  private heartbeat?: number;
  private heartbeatAck = false;
  private failedHeartbeatAck = 0;
  private seq: number | null = null;
  private sessionID?: string;

  public constructor(private token: string, private client: Client) {}

  public async connect(): Promise<void> {
    try {
      this.socket = await connectWebSocket(GATEWAY_URI);
      await this.onOpen();
      for await (const payload of this.socket.receive()) {
        if (typeof payload === "string") {
          const packet = JSON.parse(payload);
          await this.handlePacket(packet);
        } else if (isWebSocketCloseEvent(payload)) {
          this.client.removeAllListeners();
          await this.onClose(payload);
          break;
        }
      }
    } catch (err) {
      if (this.socket) this.close(1011);
      // Likely lost internet connection.
      if (err instanceof UnexpectedEOFError) {
        this.status = "resuming";
        await this.connect();
        return;
      } else throw err;
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
      `Disconnected with code ${closeData.code} for reason:\n${
        closeData.reason
      }.`
    );
    this.status = "disconnected";
    const {
      UNKNOWN_ERROR,
      INVALID_SEQ,
      RATE_LIMITED,
      SESSION_TIMEOUT
    } = Gateway.CLOSE_CODES;
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

  private send(op: Gateway.OP_CODES, data: any): Promise<void> {
    return this.socket.send(
      JSON.stringify({
        op,
        d: data
      })
    );
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
      } else if (this.status === "handshaking" && this.failedHeartbeatAck > 2) {
        await this.close(1014);
        this.client.removeAllListeners();
        throw new Error("Failed to receive heartbeat after 3 attempts!");
      }
    }

    this.heartbeatAck = false;
    await this.send(Gateway.OP_CODES.HEARTBEAT, this.seq);
  }

  public async close(code = 1000): Promise<void> {
    this.failedHeartbeatAck = 0;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (!this.socket.isClosed) this.socket.close(code);
  }

  private identifyClient(): Promise<void> {
    debug("Identifying client.");
    return this.send(Gateway.OP_CODES.IDENTIFY, {
      token: this.token,
      properties: {
        $os: Deno.platform.os,
        $browser: "socus",
        $device: "socus"
      }
    });
  }
}

export default WebsocketShard;
