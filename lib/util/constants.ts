import { Gateway } from "../@types/denocord.ts";

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
export const API_REST_VERSION = 7;
/**
 * The version of Discord's gateway
 */
export const API_WS_VERSION = 6;

export const DISCORD_EPOCH = 14200704e5;

export const DISPATCH_EVENTS: Gateway.DispatchEvents[] = [
  "PRESENCE_UPDATE",
  "VOICE_STATE_UPDATE",
  "TYPING_START",
  "MESSAGE_CREATE",
  "MESSAGE_UPDATE",
  "MESSAGE_DELETE",
  "MESSAGE_DELETE_BULK",
  "MESSAGE_REACTION_ADD",
  "MESSAGE_REACTION_REMOVE",
  "MESSAGE_REACTION_REMOVE_ALL",
  "GUILD_MEMBER_ADD",
  "GUILD_MEMBER_UPDATE",
  "GUILD_MEMBER_REMOVE",
  "GUILD_CREATE",
  "GUILD_UPDATE",
  "GUILD_DELETE",
  "GUILD_BAN_ADD",
  "GUILD_BAN_REMOVE",
  "GUILD_ROLE_CREATE",
  "GUILD_ROLE_CREATE",
  "GUILD_ROLE_DELETE",
  "CHANNEL_CREATE",
  "CHANNEL_UPDATE",
  "CHANNEL_DELETE",
  "CALL_CREATE",
  "CALL_UPDATE",
  "CALL_DELETE",
  "CHANNEL_RECIPIENT_ADD",
  "CHANNEL_RECIPIENT_REMOVE",
  "FRIEND_SUGGESTION_CREATE",
  "FRIEND_SUGGESTION_DELETE",
  "GUILD_MEMBERS_CHUNK",
  "GUILD_SYNC",
  "RESUMED",
  "READY",
  "VOICE_SERVER_UPDATE",
  "USER_UPDATE",
  "RELATIONSHIP_ADD",
  "RELATIONSHIP_REMOVE",
  "GUILD_EMOJIS_UPDATE",
  "CHANNEL_PINS_UPDATE",
  "WEBHOOKS_UPDATE",
  "USER_NOTE_UPDATE",
  "USER_GUILD_SETTINGS_UPDATE",
  "MESSAGE_ACK",
  "GUILD_INTEGRATIONS_UPDATE",
  "USER_SETTINGS_UPDATE",
  "CHANNEL_PINS_ACK",
];

export const Z_SYNC_FLUSH = new Uint8Array([0, 0, 255, 255]);

export function setAPIBase(newAPIBase: string) {
  API_BASE = newAPIBase;
}
