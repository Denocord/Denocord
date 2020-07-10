export namespace Gateway {
  export enum OP_CODES {
    DISPATCH,
    HEARTBEAT,
    IDENTIFY,
    STATUS_UPDATE,
    VOICE_STATE_UPDATE,
    RESUME = 6,
    RECONNECT,
    REQUEST_GUILD_MEMBERS,
    INVALID_SESSION,
    HELLO,
    HEARTBEAT_ACK,
  }

  export enum CLOSE_CODES {
    UNKNOWN_ERROR = 4000,
    UNKNOWN_OP_CODE,
    DECODE_ERROR,
    NOT_AUTHENTICATED,
    AUTHENTICATION_FAILED,
    ALREADY_AUTHENTICATED,
    INVALID_SEQ = 4007,
    RATE_LIMITED,
    SESSION_TIMEOUT,
    INVALID_SHARD,
    SHARDING_REQUIRED,
    INVALID_API_VER,
    INVALID_INTENTS,
    DISALLOWED_INTENTS,
  }

  export type GatewayStatus =
    | "connecting"
    | "handshaking"
    | "ready"
    | "resuming"
    | "disconnected";

  export type DispatchEvents =
    | "PRESENCE_UPDATE"
    | "VOICE_STATE_UPDATE"
    | "TYPING_START"
    | "MESSAGE_CREATE"
    | "MESSAGE_UPDATE"
    | "MESSAGE_DELETE"
    | "MESSAGE_DELETE_BULK"
    | "MESSAGE_REACTION_ADD"
    | "MESSAGE_REACTION_REMOVE"
    | "MESSAGE_REACTION_REMOVE_ALL"
    | "GUILD_MEMBER_ADD"
    | "GUILD_MEMBER_UPDATE"
    | "GUILD_MEMBER_REMOVE"
    | "GUILD_CREATE"
    | "GUILD_UPDATE"
    | "GUILD_DELETE"
    | "GUILD_BAN_ADD"
    | "GUILD_BAN_REMOVE"
    | "GUILD_ROLE_CREATE"
    | "GUILD_ROLE_CREATE"
    | "GUILD_ROLE_DELETE"
    | "CHANNEL_CREATE"
    | "CHANNEL_UPDATE"
    | "CHANNEL_DELETE"
    | "CALL_CREATE"
    | "CALL_UPDATE"
    | "CALL_DELETE"
    | "CHANNEL_RECIPIENT_ADD"
    | "CHANNEL_RECIPIENT_REMOVE"
    | "FRIEND_SUGGESTION_CREATE"
    | "FRIEND_SUGGESTION_DELETE"
    | "GUILD_MEMBERS_CHUNK"
    | "GUILD_SYNC"
    | "RESUMED"
    | "READY"
    | "VOICE_SERVER_UPDATE"
    | "USER_UPDATE"
    | "RELATIONSHIP_ADD"
    | "RELATIONSHIP_REMOVE"
    | "GUILD_EMOJIS_UPDATE"
    | "CHANNEL_PINS_UPDATE"
    | "WEBHOOKS_UPDATE"
    | "USER_NOTE_UPDATE"
    | "USER_GUILD_SETTINGS_UPDATE"
    | "MESSAGE_ACK"
    | "GUILD_INTEGRATIONS_UPDATE"
    | "USER_SETTINGS_UPDATE"
    | "CHANNEL_PINS_ACK";

  export enum GatewayIntents {
    GUILDS = 1,
    GUILD_MEMBERS = 1 << 1,
    GUILD_BANS = 1 << 2,
    GUILD_EMOJIS = 1 << 3,
    GUILD_INTEGRATIONS = 1 << 4,
    GUILD_WEBHOOKS = 1 << 5,
    GUILD_INVITES = 1 << 6,
    GUILD_VOICE_STATES = 1 << 7,
    GUILD_PRESENCES = 1 << 8,
    GUILD_MESSAGES = 1 << 9,
    GUILD_MESSAGE_REACTIONS = 1 << 10,
    GUILD_MESSAGE_TYPING = 1 << 11,
    DIRECT_MESSAGES = 1 << 12,
    DIRECT_MESSAGE_REACTIONS = 1 << 13,
    DIRECT_MESSAGE_TYPING = 1 << 14,
  }

  export interface GatewayPacket {
    // The event dispatched when the op code is 0 (the dispatch operation).
    t: DispatchEvents | null;

    // The event sequence received.
    s: number | null;

    // The op code.
    op: Gateway.OP_CODES;

    // The data.
    d: any;
  }
}

export const DATA_SYMBOL = Symbol("Denocord::Data");
export enum DataTypes {
  USER,
  GUILD,
  ROLE,
  CHANNEL,
  MEMBER,
  MESSAGE,
  UNKNOWN,
}

export interface SnowflakeBase {
  id: string;
  [DATA_SYMBOL]: DataTypes;
}

export type TypelessSnowflakeBase = Omit<SnowflakeBase, typeof DATA_SYMBOL>;

export namespace Voice {
  export enum VOICE_OP_CODES {}
}

export namespace Structures {
  export enum CHANNEL_TYPES {
    GUILD_TEXT,
    DM,
    GUILD_VOICE,
    GROUP_DM,
    CATEGORY,
    GUILD_NEWS,
    STORE,
  }

  interface BaseChannel {
    id: string;
    //"guild_id": "41771983423143937",
    name: string;
    type: number;
    //"position": 6,
    permission_overwrites: [];
    rate_limit_per_user: 2;
    nsfw: true;
    topic: "24/7 chat about how to gank Mike #2";
    last_message_id: "155117677105512449";
    parent_id: "399942396007890945";
  }
}

export interface UnavailableGuild {}

export interface Guild {}
