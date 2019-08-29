import { DISCORD_EPOCH } from "./constants.ts";

class Snowflake {
  public snowflakeID: bigint;

  constructor(snowflakeID: bigint | string) {
    this.snowflakeID = typeof snowflakeID === "string"
      ? BigInt(snowflakeID)
      : snowflakeID;
  }

  public timestamp(): Date {
    const unixRelativeTime = (this.snowflakeID >> 22n) + BigInt(DISCORD_EPOCH);
    return new Date(unixRelativeTime.toString());
  }
}

export default Snowflake;
