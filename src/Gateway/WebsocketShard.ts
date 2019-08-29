import {
  connectWebSocket,
  isWebSocketCloseEvent,
  WebSocket,
  WebSocketCloseEvent
} from "https://deno.land/std@v0.16.0/ws/mod.ts";
import createDebug from "https://deno.land/x/debuglog/debug.ts";
import { GATEWAY_URI } from "../lib/constants.ts";
import { GatewayStatus, OP_CODES, GatewayPacket } from "../types.ts";
import Client from "../Client.ts";

const debug = createDebug("dencord:WebsocketShard");

class WebsocketShard {
  public socket!: WebSocket;
  public status: GatewayStatus = "connecting";
  private heartbeat?: number;
  private heartbeatAck = false;
  private seq: number | null = null;

  public constructor(private token: string, private client: Client) { }

  public async connect(): Promise<void> {
    try {
      await this.connectWs();
      for await (const payload of this.socket.receive()) {
        if (typeof payload === "string") {
          const packet = JSON.parse(payload);
          await this.handlePacket(packet);
          if (packet.op === OP_CODES.DISPATCH) this.client.emit(packet.t, packet.d);
        } else if (isWebSocketCloseEvent(payload)) {
          this.onClose(payload);
          break;
        }
      }
    } catch (err) {
      if (this.socket) this.close(1011);
      throw err;
    }
  }

  private async connectWs(): Promise<void> {
    this.socket = await connectWebSocket(GATEWAY_URI);
    await this.onOpen();
  }

  private async onOpen(): Promise<void> {
    this.status = "handshaking";
    debug("Started handshaking.");
    await this.sendHeartbeat();
    await this.identifyClient();
  }

  private onClose(closeData: WebSocketCloseEvent): void {
    debug(`Disconnected with code ${closeData.code} for reason:\n${closeData.reason}.`);
    this.status = "disconnected";
  }

  private async handlePacket(packet: GatewayPacket): Promise<void> {
    this.seq = packet.s;
    if (packet.op === OP_CODES.HELLO) {
      this.setHeartbeat(packet.d.heartbeat_interval);
    } else if (packet.op === OP_CODES.HEARTBEAT_ACK) {
      this.heartbeatAck = true;
      debug("Received heartbeat ack.");
    }
    
    if (packet.op === OP_CODES.DISPATCH) {
      if (packet.t === "READY") this.status = "ready";
      debug(`Received dispatch event: ${packet.t}.`);
    }
  }

  private setHeartbeat(interval: number): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    debug(`Heartbeat interval was set to ${interval}ms.`);
    this.heartbeat = setInterval(this.sendHeartbeat.bind(this), interval);
  }

  private send(op: OP_CODES, data: any): Promise<void> {
    return this.socket.send(JSON.stringify({
      op,
      d: data,
    }));
  }

  private async sendHeartbeat(): Promise<void> {
    debug(`Sending heartbeat.`);
    if (!this.heartbeatAck && this.status !== "handshaking") {
      debug("Did not receive heartbeat ACK before next heartbeat!");
      return this.close(1014);
    }
    this.heartbeatAck = false;
    await this.send(OP_CODES.HEARTBEAT, this.seq);
  }

  public close(code = 1000): Promise<void> {
    return this.socket.close(code);
  }

  private identifyClient(): Promise<void> {
    debug("Identifying client.");
    return this.send(OP_CODES.IDENTIFY, {
      token: this.token,
      properties: {
        $os: Deno.platform.os,
        $browser: "socus",
        $device: "socus",
      },
    });
  }
}

export default WebsocketShard;
