export namespace Gateway {
  export type GatewayStatus =
    | "connecting"
    | "handshaking"
    | "ready"
    | "resuming"
    | "disconnected";
}
