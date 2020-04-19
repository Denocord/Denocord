import { Gateway } from "./@types/dencord.ts";

export interface ClientOptions {
  compress?: boolean;
  compressStream?: boolean;
  intents?: Gateway.GatewayIntents;
}
