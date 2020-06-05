import { SnowflakeBase, DataTypes, DATA_SYMBOL } from "../@types/denocord.ts";
export default interface User extends SnowflakeBase {
  username: string;
  discriminator: string;
  avatar: string;
  bot?: boolean;
  system?: boolean;
  public_flags?: number;
  [DATA_SYMBOL]: DataTypes.USER;
}
