import { SnowflakeBase, DATA_SYMBOL, DataTypes } from "../@types/denocord.ts";
import User from "./User.ts";

export enum ChannelTypes {
  GUILD_TEXT,
  DM,
  GUILD_VOICE,
  GROUP_DM,
  GUILD_CATEGORY,
  GUILD_NEWS,
  GUILD_STORE,
}

export type GuildChannelTypes =
  | ChannelTypes.GUILD_CATEGORY
  | ChannelTypes.GUILD_NEWS
  | ChannelTypes.GUILD_STORE
  | ChannelTypes.GUILD_TEXT
  | ChannelTypes.GUILD_VOICE;
export default interface Channel extends SnowflakeBase {
  type: ChannelTypes;
  [DATA_SYMBOL]: DataTypes.CHANNEL;
}

interface NamedChannel extends Channel {
  name: string;
}

interface TextableChannel extends Channel {
  last_pin_timestamp: number;
  last_message_id: string | null;
}

export interface GuildChannel extends NamedChannel {
  type: GuildChannelTypes;
  guild_id: string;
  position: number;
  permission_overwrites: {
    id: string;
    type: "role" | "member";
    allow: number;
    deny: number;
  }[];
  parent_id: string;
}

export interface TextChannel extends GuildChannel, TextableChannel {
  type: ChannelTypes.GUILD_TEXT | ChannelTypes.GUILD_NEWS;
  topic: string | null;
  nsfw: boolean;
  rate_limit_per_user: number;
}

export interface VoiceChannel extends GuildChannel {
  type: ChannelTypes.GUILD_VOICE;
  bitrate: number;
  user_limit: number;
}

export interface GroupDMChannel extends NamedChannel, TextableChannel {
  type: ChannelTypes.GROUP_DM;
  owner_id: string;
  application_id?: string;
  icon: string | null;
  recipients: User[];
}

export interface DMChannel extends TextableChannel {
  type: ChannelTypes.DM;
}
