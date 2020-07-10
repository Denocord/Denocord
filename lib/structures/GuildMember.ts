import { SnowflakeBase, DATA_SYMBOL, DataTypes } from "../@types/denocord.ts";
import User from "./User.ts";
export default interface GuildMember extends SnowflakeBase {
  user?: User;
  nick: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf: boolean;
  mute: boolean;
  [DATA_SYMBOL]: DataTypes.MEMBER;
}
