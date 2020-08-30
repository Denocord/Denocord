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
  objectWithoutDataType: APITypes.APIWebhookData,
  dataType: APITypes.DataTypes.WEBHOOK,
): APITypes.Webhook;
export default function createObject(
  objectWithoutDataType: APITypes.APIInviteData,
  dataType: APITypes.DataTypes.INVITE,
): APITypes.Invite;
export default function createObject(
  objectWithoutDataType: any,
  dataType: APITypes.DataTypes,
): any {
  if (dataType === APITypes.DataTypes.GUILD) {
    const g = <APITypes.APIGuildData> objectWithoutDataType;
    if (g.roles) {
      objectWithoutDataType.roles = new Map(
        g.roles.map((
          r: APITypes.APIRoleData,
        ) => [r.id, createObject(r, APITypes.DataTypes.ROLE)]),
      );
    }
    if (g.channels) {
      objectWithoutDataType.channels = new Map(
        g.channels.map((
          c: APITypes.APIChannelData,
        ) => [c.id, createObject(c, APITypes.DataTypes.CHANNEL)]),
      );
    }
    if (g.members) {
      objectWithoutDataType.members = new Map(
        g.members.map((
          m: APITypes.APIGuildMemberData,
        ) => [m.user?.id, createObject(m, APITypes.DataTypes.MEMBER)]),
      );
    }
    if (g.presences) {
      objectWithoutDataType.presences = new Map(
        g.presences.map((p: APITypes.APIPresenceUpdateData) => [p.user.id, p]),
      );
    }
    if (g.voice_states) {
      objectWithoutDataType.voice_states = new Map(
        g.voice_states.map((
          vs: APITypes.APIVoiceStatePartial,
        ) => [vs.user_id, vs]),
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
    if (objectWithoutDataType.user) {
      objectWithoutDataType.user = createObject(
        objectWithoutDataType.user,
        APITypes.DataTypes.USER,
      );
    }
  } else if (dataType === APITypes.DataTypes.WEBHOOK) {
    if (objectWithoutDataType.user) {
      objectWithoutDataType.user = createObject(
        objectWithoutDataType.user,
        APITypes.DataTypes.USER,
      );
    }
  } else if (dataType === APITypes.DataTypes.MESSAGE) {
    if (objectWithoutDataType.author) {
      objectWithoutDataType.author = createObject(
        objectWithoutDataType.author,
        APITypes.DataTypes.USER,
      );
    }
    if (objectWithoutDataType.member) {
      objectWithoutDataType.member = createObject(
        objectWithoutDataType.member,
        APITypes.DataTypes.MEMBER,
      );
    }
    if (objectWithoutDataType.mentions) {
      objectWithoutDataType.mentions = objectWithoutDataType.mentions.map(
        (mention: APITypes.APIMessageMentionData) => {
          const user: APITypes.APIMessageMentionData = createObject(
            mention,
            APITypes.DataTypes.USER,
          );
          if (user.member) {
            user.member = createObject(
              user.member,
              APITypes.DataTypes.MEMBER,
            );
          }
          return <APITypes.MessageMention> user;
        },
      );
    }
  } else if (dataType === APITypes.DataTypes.INVITE) {
    if (objectWithoutDataType.guild) {
      objectWithoutDataType.guild = createObject(
        objectWithoutDataType.guild,
        APITypes.DataTypes.GUILD,
      );
    }
    if (objectWithoutDataType.channel) {
      objectWithoutDataType.channel = createObject(
        objectWithoutDataType.channel,
        APITypes.DataTypes.CHANNEL,
      );
    }
    if (objectWithoutDataType.inviter) {
      objectWithoutDataType.inviter = createObject(
        objectWithoutDataType.inviter,
        APITypes.DataTypes.USER,
      );
    }
    if (objectWithoutDataType.target_user) {
      objectWithoutDataType.target_user = createObject(
        objectWithoutDataType.target_user,
        APITypes.DataTypes.USER,
      );
    }
  }

  objectWithoutDataType[APITypes.DATA_SYMBOL] = dataType;
  return objectWithoutDataType;
}
