import { SnowflakeBase, DataTypes, DATA_SYMBOL } from "../@types/denocord.ts";
export default interface Guild extends SnowflakeBase {
  name: string;
  icon: string | null;
  splash: string | null;
  discovery_splash: string | null;
  owner?: boolean;
  owner_id: string;
  permissions?: number;
  region: string;
  afk_channel_id: string | null;
  afk_timeout: number;
  verification_level: number;
  default_message_notifications: number;
  explicit_content_filter: number;
  roles: Map<string, any>;
  emojis: any[];
  features: GuildFeatures[];
  mfa_level: number;
  application_id: string | null;
  widget_enabled: boolean;
  widget_channel_id: string | null;
  system_channel_id: string | null;
  system_channel_flags: number;
  rules_channel_id: string | null;
  joined_at?: string;
  large?: boolean;
  unavailable?: boolean;
  member_count?: number;
  voice_states?: Map<string, any>;
  members?: Map<string, any>;
  channels?: Map<string, any>;
  presences?: Map<string, any>;
  max_presences?: number | null;
  max_members?: number;
  vanity_url_code: string | null;
  description: string | null;
  banner: string | null;
  premium_tier: number;
  premium_subscription_count: number;
  preferred_locale: string;
  public_updates_channel_id: string | null;
  max_video_channel_users?: number;
  approximate_member_count?: number;
  approximate_presence_count?: number;

  [DATA_SYMBOL]: DataTypes.GUILD;
}

export type GuildFeatures =
  | "INVITE_SPLASH"
  | "VIP_REGIONS"
  | "VANITY_URL"
  | "VERIFIED"
  | "PARTNERED"
  | "PUBLIC"
  | "COMMERCE"
  | "NEWS"
  | "DISCOVERABLE"
  | "FEATURABLE"
  | "ANIMATED_ICON"
  | "BANNER"
  | "PUBLIC_DISABLED"
  | "WELCOME_SCREEN_ENABLED";
