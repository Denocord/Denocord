import { Gateway } from "./@types/denocord.ts";

export interface ClientOptions {
  compress?: boolean;
  compressStream?: boolean;
  intents?: Gateway.GatewayIntents;
}
