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
    HEARTBEAT_ACK
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
    SHARDING_REQUIRED
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
    STORE
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
