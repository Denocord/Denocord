import { SnowflakeBase, DataTypes, DATA_SYMBOL } from "../@types/denocord.ts";
import User from "../structures/User.ts";
import GuildMember from "../structures/GuildMember.ts";
import Channel from "../structures/Channel.ts";
import Role from "../structures/Role.ts";

type RawGuildData = {
  roles: any[];
  channels: any[];
  members: any[];
  presences: any[];
  voice_states: any[];
};

export default function createObject<T extends SnowflakeBase>(
  objectWithoutDataType: Omit<T, typeof DATA_SYMBOL>,
  dataType: T[typeof DATA_SYMBOL],
): T {
  if (dataType === DataTypes.GUILD) {
    const g = <RawGuildData> <any> objectWithoutDataType;
    (<any> objectWithoutDataType).roles = new Map(
      g.roles.map((r) => [r.id, createObject<Role>(r, DataTypes.ROLE)]),
    );
    (<any> objectWithoutDataType).channels = new Map(
      g.channels.map((
        c,
      ) => [c.id, createObject<Channel>(c, DataTypes.CHANNEL)]),
    );
    (<any> objectWithoutDataType).members = new Map(
      g.members.map((
        m,
      ) => [m.id, createObject<GuildMember>(m, DataTypes.MEMBER)]),
    );
    (<any> objectWithoutDataType).presences = new Map(
      g.presences.map((p) => [p.id, p]),
    );
    (<any> objectWithoutDataType).voice_states = new Map(
      g.voice_states.map((vs) => [vs.id, vs]),
    );
  } else if (dataType === DataTypes.CHANNEL) {
    if ((<any> objectWithoutDataType).recipients) {
      (<any> objectWithoutDataType).recipients = (<any> objectWithoutDataType)
        .recipients.map((u: any) => createObject<User>(u, DataTypes.USER));
    }
  } else if (dataType === DataTypes.MEMBER) {
    (<any> objectWithoutDataType).user = createObject<User>(
      (<any> objectWithoutDataType).user,
      DataTypes.USER,
    );
  }

  (<T> objectWithoutDataType)[DATA_SYMBOL] = dataType;
  return (<T> objectWithoutDataType);
}
