import { SnowflakeBase, DATA_SYMBOL, DataTypes } from "../@types/denocord.ts";
export default interface Role extends SnowflakeBase {
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: number;
  managed: number;
  mentionable: boolean;
  [DATA_SYMBOL]: DataTypes.ROLE;
}
