import { Gateway } from "../@types/denocord.ts";
import { APITypes } from "../deps.ts";

/**
 * The base domain for all API operations.
 * This can be overriden to a different domain to
 * serve microservice bots with a proxy.
 * Overriding the default value is done at your own
 * risk!
 */
export let API_BASE = "https://discord.com";
/**
 * The version of Discord's REST API
 */
export const API_REST_VERSION = APITypes.APIVersion;
/**
 * The version of Discord's gateway
 */
export const API_WS_VERSION = APITypes.APIVersion;

export const DISCORD_EPOCH = 14200704e5;
export const Z_SYNC_FLUSH = new Uint8Array([0, 0, 255, 255]);

export function setAPIBase(newAPIBase: string) {
  API_BASE = newAPIBase;
}
