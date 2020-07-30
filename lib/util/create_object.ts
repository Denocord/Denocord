import { APITypes } from "../deps.ts";

export default function createObject(
  objectWithoutDataType: APITypes.APIGuildData,
  dataType: APITypes.DataTypes.GUILD,
): APITypes.Guild;
export default function createObject(
  objectWithoutDataType: APITypes.APIRoleData,
  dataType: APITypes.DataTypes.ROLE,
): APITypes.Role;
export default function createObject(
  objectWithoutDataType: APITypes.APIChannelData,
  dataType: APITypes.DataTypes.CHANNEL,
): APITypes.Channel;
export default function createObject(
  objectWithoutDataType: APITypes.APIGuildMemberData,
  dataType: APITypes.DataTypes.MEMBER,
): APITypes.GuildMember;
export default function createObject(
  objectWithoutDataType: APITypes.APIUserData,
  dataType: APITypes.DataTypes.USER,
): APITypes.User;
export default function createObject(
  objectWithoutDataType: APITypes.APIMessageData,
  dataType: APITypes.DataTypes.MESSAGE,
): APITypes.Message;

export default function createObject(
  objectWithoutDataType: any,
  dataType: APITypes.DataTypes,
): any {
  if (dataType === APITypes.DataTypes.GUILD) {
    const g = <APITypes.APIGuildData> objectWithoutDataType;
    if (g.roles) {
      objectWithoutDataType.roles = new Map(
        g.roles.map((r) => [r.id, createObject(r, APITypes.DataTypes.ROLE)]),
      );
    }
    if (g.channels) {
      objectWithoutDataType.channels = new Map(
        g.channels.map((
          c,
        ) => [c.id, createObject(c, APITypes.DataTypes.CHANNEL)]),
      );
    }
    if (g.members) {
      objectWithoutDataType.members = new Map(
        g.members.map((
          m,
        ) => [m.user?.id, createObject(m, APITypes.DataTypes.MEMBER)]),
      );
    }
    if (g.presences) {
      objectWithoutDataType.presences = new Map(
        g.presences.map((p) => [p.user.id, p]),
      );
    }
    if (g.voice_states) {
      objectWithoutDataType.voice_states = new Map(
        g.voice_states.map((vs) => [vs.user_id, vs]),
      );
    }
  } else if (dataType === APITypes.DataTypes.CHANNEL) {
    if (objectWithoutDataType.recipients) {
      objectWithoutDataType.recipients = objectWithoutDataType
        .recipients.map((u: APITypes.APIUserData) =>
          createObject(u, APITypes.DataTypes.USER)
        );
    }
  } else if (dataType === APITypes.DataTypes.MEMBER) {
    (<any> objectWithoutDataType).user = createObject(
      (<any> objectWithoutDataType).user,
      APITypes.DataTypes.USER,
    );
  }

  objectWithoutDataType[APITypes.DATA_SYMBOL] = dataType;
  return objectWithoutDataType;
}
