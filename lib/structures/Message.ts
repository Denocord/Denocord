import {
  SnowflakeBase,
  TypelessSnowflakeBase,
  DATA_SYMBOL,
  DataTypes,
} from "../@types/denocord.ts";
import User from "./User.ts";
import GuildMember from "./GuildMember.ts";
import { GuildChannel } from "./Channel.ts";

export interface Message extends SnowflakeBase {
  channel_id: string;
  guild_id?: string;
  author: User;
  member?: Omit<GuildMember, "user">;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  tts: boolean;
  mention_everyone: boolean;
  mentions: (User & {
    member?: Omit<GuildMember, "user">;
  })[];
  mention_roles: string[];
  mention_channels?: Pick<GuildChannel, "id" | "guild_id" | "type" | "name">;
  attachments: MessageAttachment[];
  embeds: MessageEmbed[];
  reactions?: MessageReaction[];
  nonce: string | number;
  pinned: boolean;
  webhook_id?: string;
  type: MessageTypes;
  activity?: MessageActivity;
  application?: MessageApplication;
  message_reference?: MessageReference;
  [DATA_SYMBOL]: DataTypes.MESSAGE;
}

interface MessageAttachment extends TypelessSnowflakeBase {
  filename: string;
  size: string;
  url: string;
  proxy_url: string;
  height: string | null;
  width: string | null;
}
interface MessageReaction {
  count: number;
  me: boolean;
  emoji: {
    id: string | null;
    name: string | null;
    animated?: boolean;
  };
}
interface MessageActivity {
  type: MessageActivityTypes;
  party_id?: string;
}
enum MessageActivityTypes {
  JOIN = 1,
  SPECTATE,
  LISTEN,
  JOIN_REQUEST = 5,
}
interface MessageApplication extends TypelessSnowflakeBase {
  cover_image?: string;
  description: string;
  icon: string;
  name: string;
}
interface MessageReference {
  message_id?: string;
  channel_id: string;
  guild_id?: string;
}
export interface MessageEmbed {
    title?: string;
    type?: "rich" | "image" | "video" | "gifv" | "article" | "link";
    description?: string;
    url?: string;
    timestamp?: string;
    color?: number;
    footer?: EmbedFooter;
    image?: EmbedImage;
    thumbnail?: EmbedImage;
    video?: EmbedVideo;
    provider?: EmbedProvider;
    author?: EmbedAuthor;
    fields?: EmbedField[];
}

interface EmbedFooter {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
}

interface EmbedImage {
    url?: string;
    proxy_url?: string;
    height?: number;
    width?: number;
}

interface EmbedVideo {
    url?: string;
    height?: number;
    width?: number;
}

interface EmbedProvider {
    name?: string;
    url?: string;
}

interface EmbedAuthor {
    name?: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
}

interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export enum MessageTypes {
  DEFAULT,
  RECIPIENT_ADD,
  RECIPIENT_REMOVE,
  CALL,
  CHANNEL_NAME_CHANGE,
  CHANNEL_ICON_CHANGE,
  CHANNEL_PINNED_MESSAGE,
  GUILD_MEMBER_JOIN,
  USER_PREMIUM_GUILD_SUBSCRIPTION,
  USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1,
  USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2,
  USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3,
  CHANNEL_FOLLOW_ADD,
  GUILD_DISCOVERY_DISQUALIFIED,
  GUILD_DISCOVERY_REQUALIFIED,
}

export const MessageFlags = {
  CROSSPOSTED: 1,
  IS_CROSSPOST: 1 << 1,
  SUPPRESS_EMBEDS: 1 << 2,
  SOURCE_MESSAGE_DELETED: 1 << 3,
  URGENT: 1 << 4,
};
