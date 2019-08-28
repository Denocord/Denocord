const { platform } = Deno;
import createDebug from "https://deno.land/x/debuglog/debug.ts";
import { connectWebSocket, isWebSocketCloseEvent, WebSocket } from "https://deno.land/std@v0.16.0/ws/mod.ts";
import { GATEWAY_URI } from "../constants.ts";
import { GatewayStatus, WebsocketPacket, OP_CODES } from "./gatewayTypes.ts";

const debug = createDebug("socus:WebsocketShard");

const TOKEN = "NDk1MTkxMTY2NTY4ODkwMzcw.XWUFEg.NBi0qSB4N6TtgglY47N7K2t1iso";

class WebsocketShard {
  public socket!: WebSocket;
  public status: GatewayStatus = "connecting";
  private heartbeat?: number;
  private heartbeatAck = false;
  //private unavailableGuilds = new Set();
  private seq: number | null = null;

  constructor() {
    //this.socket = new WebSocket(`${GATEWAY_URI}&encoding=json`);
    //this.configureWebsocket();
  }

  public async connect() {
    try {
      this.socket = await connectWebSocket(GATEWAY_URI);
      await this.onOpen();
      for await (const msg of this.socket.receive()) {
        if (typeof msg === "string") {
          await this.handlePacket(JSON.parse(msg));
        } else if (isWebSocketCloseEvent(msg)) {
          console.error(`closed: code=${msg.code}, reason=${msg.reason}`);
        }
      }
    } catch (err) {
      if (this.socket) this.close(1011);
      throw err;
    }
  }

  private async onOpen() {
    this.status = "handshaking";
    debug("Started handshaking.");
    await this.sendHeartbeat();
    await this.identifyClient();
  }

  private onClose(closeData: any) {
    debug(`Disconnected ${!closeData.wasClean ? "un" : ""}cleanly with code ${closeData.code} for reason:\n${closeData.reason}.`);
    this.status = "disconnected";
  }

  private async handlePacket(packet: WebsocketPacket) {
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

  private setHeartbeat(interval: number) {
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

  private identifyClient() {
    debug("Identifying client.");
    return this.send(OP_CODES.IDENTIFY, {
      token: TOKEN,
      properties: {
        $os: platform.os,
        $browser: "socus",
        $device: "socus",
      },
    });
  }
}

export default WebsocketShard;
