import { APITypes } from "../deps.ts";
export default function createObject(
  objectWithoutDataType: APITypes.APIGuild,
  dataType: APITypes.DataTypes.GUILD,
): APITypes.Guild;
export default function createObject(
  objectWithoutDataType: APITypes.APIRole,
  dataType: APITypes.DataTypes.ROLE,
): APITypes.Role;
export default function createObject(
  objectWithoutDataType: APITypes.APIChannel,
  dataType: APITypes.DataTypes.CHANNEL,
): APITypes.Channel;
export default function createObject(
  objectWithoutDataType: APITypes.APIGuildMember,
  dataType: APITypes.DataTypes.MEMBER,
): APITypes.GuildMember;
export default function createObject(
  objectWithoutDataType: APITypes.APIUser,
  dataType: APITypes.DataTypes.USER,
): APITypes.User;
export default function createObject(
  objectWithoutDataType: APITypes.APIMessage,
  dataType: APITypes.DataTypes.MESSAGE,
): APITypes.Message;
export default function createObject(
  objectWithoutDataType: APITypes.APIWebhook,
  dataType: APITypes.DataTypes.WEBHOOK,
): APITypes.Webhook;
export default function createObject(
  objectWithoutDataType: APITypes.APIInvite,
  dataType: APITypes.DataTypes.INVITE,
): APITypes.Invite;
export default function createObject(
    objectWithoutDataType: APITypes.Emoji,
    dataType: APITypes.DataTypes.EMOJI,
): APITypes.Emoji;
export default function createObject(
  objectWithoutDataType: any,
  dataType: APITypes.DataTypes,
): any {
  if (dataType === APITypes.DataTypes.GUILD) {
    const g = <APITypes.APIGuild> objectWithoutDataType;
    if (g.roles) {
      objectWithoutDataType.roles = new Map(
        g.roles.map((
          r: APITypes.APIRole,
        ) => [r.id, createObject(r, APITypes.DataTypes.ROLE)]),
      );
    }
    if (g.channels) {
      objectWithoutDataType.channels = new Map(
        g.channels.map((
          c: APITypes.APIChannel,
        ) => [c.id, createObject(c, APITypes.DataTypes.CHANNEL)]),
      );
    }
    if (g.members) {
      objectWithoutDataType.members = new Map(
        g.members.map((
          m: APITypes.APIGuildMember,
        ) => [m.user?.id, createObject(m, APITypes.DataTypes.MEMBER)]),
      );
    }
    if (g.presences) {
      objectWithoutDataType.presences = new Map(
        g.presences.map((p: APITypes.GatewayPresenceUpdate) => [p.user.id, p]),
      );
    }
    if (g.voice_states) {
      objectWithoutDataType.voice_states = new Map(
        g.voice_states.map((
          vs: Omit<APITypes.GatewayVoiceState, "guild_id">,
        ) => [vs.user_id, vs]),
      );
    }
    if (g.emojis) {
        g.emojis = g.emojis.map((e: APITypes.APIEmoji) => createObject(e, APITypes.DataTypes.EMOJI));
    }
  } else if (dataType === APITypes.DataTypes.CHANNEL) {
    if (objectWithoutDataType.recipients) {
      objectWithoutDataType.recipients = objectWithoutDataType
        .recipients.map((u: APITypes.APIUser) =>
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
        (
          mention: APITypes.APIUser & {
            member?: Omit<APITypes.APIGuildMember, "user">;
          },
        ) => {
          const user: APITypes.APIUser & {
            member?: Omit<APITypes.APIGuildMember, "user">;
          } = createObject(
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
