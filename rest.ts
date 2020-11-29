import RequestHandler from "./lib/rest/request_handler.ts";
import { APITypes } from "./lib/deps.ts";
import createObject from "./lib/util/create_object.ts";
import validateAllowedMentions from "./lib/util/allowed_mentions.ts";
import type { Arrayable } from "./lib/util/type_utils.ts";
const rest = RequestHandler.get();

type WithReason<T> = T & {
  reason?: string;
};

type TypeByID<T extends APITypes.DataTypes> = {
  id: string;
  [APITypes.DATA_SYMBOL]: T;
};

type ParentObject = TypeByID<APITypes.DataTypes> | typeof ROOT_SYMBOL;

type ObjectOrType<
  T extends {
    [APITypes.DATA_SYMBOL]: APITypes.DataTypes;
  },
> = T | TypeByID<T[typeof APITypes.DATA_SYMBOL]>;

export default rest;

export const ROOT_SYMBOL = Symbol("Denocord::DataRoot");

/**
 * Options for deleting webhooks
 */
export interface WebhookRemoveOptions {
  /**
   * The token of the webhook
   */
  token?: string;
  /**
   * The reason for deleting the webhook
   */
  reason?: string;
}

//#region create(...)

/**
 * Creates a message in the specified channel
 * @param parent The channel to create the message in
 * @param payload The message content
 */
export function create(
  parent: ObjectOrType<APITypes.Channel>,
  type: APITypes.DataTypes.MESSAGE,
  payload: APITypes.MessageCreatePayload,
): Promise<APITypes.Message>;
/**
 * Creates a invite in the specified channel
 * @param parent The channel to create the invite in
 * @param payload The properties of new invite
 */
export function create(
  parent: ObjectOrType<APITypes.Channel>,
  type: APITypes.DataTypes.INVITE,
  payload?: WithReason<APITypes.RESTPostAPIChannelInviteJSONBody>,
): Promise<APITypes.Invite>;
/**
 * Creates a webhook in the specified channel
 * @param parent The channel to create the webhook in
 * @param payload The webhook data
 */
export function create(
  parent: ObjectOrType<APITypes.Channel>,
  type: APITypes.DataTypes.WEBHOOK,
  payload: WithReason<APITypes.RESTPostAPIChannelWebhookJSONBody>,
): Promise<APITypes.Webhook>;
/**
 * Creates a private message channel with a user
 * @param parent The user to create the DM channel for 
 */
export function create(
  parent: ObjectOrType<APITypes.User>,
  type: APITypes.DataTypes.CHANNEL,
  _?: never,
): Promise<APITypes.Channel>;
/**
 * Creates a guild. The bot user must be in less than 10 guilds to be able to create one.
 * @param payload New guild options
 */
export function create(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.GUILD,
  payload: APITypes.RESTPostAPIGuildsJSONBody,
): Promise<APITypes.Guild>;
/**
 * Executes a webhook
 * @param parent The webhook to use for creating the message - must contain both `id` and `token`
 * @param payload The options for a message
 */
export function create<T extends APITypes.WebhookExecutePayload>(
  parent: ObjectOrType<APITypes.Webhook> & {
    token: string;
  },
  type: APITypes.DataTypes.MESSAGE,
  payload: T,
): Promise<T["wait"] extends true ? APITypes.Message : void>;
/**
 * Creates a role in a guild
 * @param parent The guild to create the role in
 * @param payload The options for creating the role
 */
export function create(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.ROLE,
  payload: WithReason<APITypes.RESTPostAPIGuildRoleJSONBody>,
): Promise<APITypes.Role>;
/**
 * Creates an emoji in a guild
 * @param parent The guild to create the emoji in
 * @param payload The options for creating the emoji
 */
export function create(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.EMOJI,
  payload: WithReason<APITypes.RESTPostAPIGuildEmojiJSONBody>,
): Promise<APITypes.Emoji>;
export async function create(
  parent: ParentObject,
  type: APITypes.DataTypes,
  payload: any,
): Promise<
  TypeByID<APITypes.DataTypes> | {
    [APITypes.DATA_SYMBOL]: APITypes.DataTypes;
  } | void
> {
  if (parent === ROOT_SYMBOL) {
    // The thing to create must be determined by type
    if (type === APITypes.DataTypes.GUILD) {
      const p = <APITypes.RESTPostAPIGuildsJSONBody> payload;
      if (!p || !p.name) {
        throw new Error("Missing guild name");
      }
      return createObject(
        await rest.request(
          "POST",
          "/guilds",
          true,
          p,
        ),
        APITypes.DataTypes.GUILD,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.CHANNEL) {
    if (type === APITypes.DataTypes.MESSAGE) {
      const p = <APITypes.MessageCreatePayload> payload;
      if (!p || (!p.files && !p.content && !p.embed)) {
        throw new Error("Missing message content");
      }
      validateAllowedMentions(p.allowed_mentions);
      let body: APITypes.MessageCreatePayload | FormData = payload;
      if (p.files && p.files.length > 0) {
        body = new FormData();
        for (const file of p.files) {
          body.append("file", file);
        }
        delete p.files;
        body.append("payload_json", JSON.stringify(p));
      }
      return createObject(
        await rest.request(
          "POST",
          `/channels/${parent.id}/messages`,
          true,
          body,
        ),
        APITypes.DataTypes.MESSAGE,
      );
    } else if (type === APITypes.DataTypes.WEBHOOK) {
      const p = <APITypes.RESTPostAPIChannelWebhookJSONBody> payload;
      if (!p || !p.name) {
        throw new Error("Missing webhook name");
      }

      return createObject(
        await rest.request(
          "POST",
          `/channels/${parent.id}/webhooks`,
          true,
          payload,
        ),
        APITypes.DataTypes.WEBHOOK,
      );
    } else if (type === APITypes.DataTypes.INVITE) {
      const p = <APITypes.RESTPostAPIChannelInviteJSONBody> payload || {};
      return createObject(
        await rest.request(
          "POST",
          `/channels/${parent.id}/invites`,
          true,
          p,
        ),
        APITypes.DataTypes.INVITE,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.USER) {
    if (type === APITypes.DataTypes.CHANNEL) {
      return createObject(
        await rest.request(
          "POST",
          "/users/@me/channels",
          true,
          {
            recipient_id: parent.id,
          },
        ),
        APITypes.DataTypes.CHANNEL,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.GUILD) {
    if (type === APITypes.DataTypes.ROLE) {
      return createObject(
        await rest.request(
          "POST",
          `/guilds/${parent.id}/roles`,
          true,
          payload,
        ),
        APITypes.DataTypes.ROLE,
      );
    } else if (type === APITypes.DataTypes.EMOJI) {
      return createObject(
        await rest.request(
          "POST",
          `/guilds/${parent.id}/emojis`,
          true,
          payload,
        ),
        APITypes.DataTypes.EMOJI,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.WEBHOOK) {
    if (type === APITypes.DataTypes.MESSAGE) {
      const p = <APITypes.WebhookExecutePayload> payload;
      if (
        !p || (!p.files && !p.content && (!p.embeds || p.embeds.length === 0))
      ) {
        throw new Error("Missing message content");
      }
      validateAllowedMentions(p.allowed_mentions);
      let body: APITypes.WebhookExecutePayload | FormData = payload;
      if (p.files && p.files.length > 0) {
        body = new FormData();
        for (const file of p.files) {
          body.append("file", file);
        }
        delete p.files;
        body.append("payload_json", JSON.stringify(p));
      }
      let url = `/webhooks/${parent.id}/${
        (<{
          token: string;
        }> <unknown> parent).token
      }`;
      if (payload.wait) {
        url += "?wait=true";
        delete payload.wait;
      }
      return rest.request(
        "POST",
        url,
        false,
        body,
      ).then((m) => {
        if (payload.wait) {
          return createObject(m, APITypes.DataTypes.MESSAGE);
        } else {
          return undefined;
        }
      });
    }
  }
}

create.ban = async function (
  guild: ObjectOrType<APITypes.Guild>,
  user: ObjectOrType<APITypes.User>,
  options?: WithReason<APITypes.RESTPutAPIGuildBanJSONBody>,
): Promise<void> {
  await rest.request(
    "PUT",
    `/guilds/${guild.id}/bans/${user.id}`,
    true,
    options,
  );
};

/**
 * Triggers the typing indicator in a channel
 * @param channel The channel to trigger the typing indicator in
 */
create.typing = async function (
  channel: ObjectOrType<APITypes.Channel>,
): Promise<void> {
  await rest.request(
    "POST",
    `/channels/${channel.id}/typing`,
    true,
  );
};

/**
 * Adds a reaction to a message
 * @param channel The channel the message is in
 * @param message The message to react to
 * @param emoji The emoji to react with
 */
create.reaction = async function (
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
  emoji: string,
): Promise<void> {
  await rest.request(
    "PUT",
    `/channels/${channel.id}/messages/${message.id}/reactions/${
      encodeURIComponent(emoji)
    }/@me`,
    true,
  );
};

/**
 * Pins a message
 * @param channel The channel the message is in
 * @param message The message to pin
 * @param reason The reason for pinning the message
 */
create.pin = async function (
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
  reason?: string,
): Promise<void> {
  await rest.request(
    "PUT",
    `/channels/${channel.id}/pins/${message.id}`,
    true,
    {
      reason,
    },
  );
};

/**
 * Publishes a message in an announcement channel to other guilds
 * @param channel The announcement channel the message is in
 * @param message The message to crosspost
 */
create.crosspost = async function (
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
): Promise<APITypes.Message> {
  return createObject(
    await rest.request(
      "POST",
      `/channels/${channel.id}/messages/${message.id}/crosspost`,
      true,
    ),
    APITypes.DataTypes.MESSAGE,
  );
};

/**
 * Follows an announcement channel
 * @param channel The channel to follow
 * @param target The ID of the target channel
 */
create.follow = async function (
  channel: ObjectOrType<APITypes.Channel>,
  target: string,
): Promise<APITypes.APIFollowedChannel> {
  return rest.request("POST", `/channels/${channel.id}/followers`, true, {
    webhook_channel_id: target,
  });
};
//#endregion create(...)
//#region get(...)
/**
 * Gets a channel from Discord
 * @param id The ID of the channel
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.CHANNEL,
  id: string,
): Promise<APITypes.Channel>;
/**
 * Gets a user from Discord
 * @param id The user ID. To fetch current user, use "@me"
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.USER,
  id: string,
): Promise<APITypes.User>;
/**
 * Gets a guild from Discord
 * @param id The guild ID
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.GUILD,
  id: string,
): Promise<APITypes.Guild>;
/**
 * Gets an invite from Discord
 * @param id The invite code
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.INVITE,
  code: string,
): Promise<APITypes.Invite>;
/**
 * Gets a webhook from from Discord
 * @param id The webhook ID
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.WEBHOOK,
  id: string,
): Promise<APITypes.Webhook>;
/**
 * Gets a webhook from from Discord using the webhook token
 * @param id The webhook ID
 * @param token The token of the webhook
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.WEBHOOK,
  id: string,
  token: string,
): Promise<
  Pick<
    APITypes.Webhook,
    | keyof APITypes.RESTGetAPIWebhookWithTokenResult
    | typeof APITypes.DATA_SYMBOL
  >
>;

/**
 * Gets a list of channels from a Discord guild
 * @param parent The guild to get the channel list from
 */
export function get(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.CHANNEL,
): Promise<APITypes.Channel[]>;
/**
 * Gets a list of roles from a Discord guild
 * @param parent The guild to get the role list from
 */
export function get(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.ROLE,
): Promise<APITypes.Role[]>;
/**
 * Gets a list of webhooks from a Discord guild
 * @param parent The guild to get the webhook list from
 */
export function get(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.WEBHOOK,
): Promise<APITypes.Webhook[]>;
/**
 * Gets a list of webhooks from a Discord channel
 * @param parent The channel to get the webhook list from
 */
export function get(
  parent: ObjectOrType<APITypes.Channel>,
  type: APITypes.DataTypes.WEBHOOK,
): Promise<APITypes.Webhook[]>;
/**
 * Gets a list of invites from a Discord guild
 * @param parent The guild to get the invite list from
 */
export function get(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.INVITE,
): Promise<APITypes.Invite[]>;
/**
 * Gets a specific member from a Discord guild
 * @param parent The guild to get the member from
 * @param id The ID of the member
 */
export function get(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.MEMBER,
  id: string,
): Promise<APITypes.GuildMember>;
/**
 * Gets a specific emoji from a Discord guild
 * @param parent The guild to get the emoji from
 * @param id The ID of the emoji
 */
export function get(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.EMOJI,
  id: string,
): Promise<APITypes.Emoji>;
/**
 * Gets a list of integrations for a Discord guild
 * The objects are returned without a data type.
 * @param parent The guild to get the integrations for
 */
export function get(
  parent: ObjectOrType<APITypes.Guild>,
  type: APITypes.DataTypes.INTEGRATION,
): Promise<APITypes.APIGuildIntegration[]>;
/**
 * Get a specific message from a Discord channel
 * @param parent The channel to get the message from
 * @param id The ID of the message
 */
export async function get(
  parent: ObjectOrType<APITypes.Channel>,
  type: APITypes.DataTypes.MESSAGE,
  id: string,
): Promise<APITypes.Message>;
/**
 * Gets a list of invites from a Discord channel
 * @param parent The guild to get the channel list from
 */
export function get(
  parent: ObjectOrType<APITypes.Channel>,
  type: APITypes.DataTypes.INVITE,
): Promise<APITypes.Invite[]>;

export async function get(
  parent: ParentObject,
  type: APITypes.DataTypes,
  id?: string,
  options?: any,
): Promise<
  | Arrayable<TypeByID<APITypes.DataTypes>>
  | Arrayable<{
    [APITypes.DATA_SYMBOL]: APITypes.DataTypes;
  }>
  | APITypes.APIGuildIntegration[]
  | void
> {
  if (parent === ROOT_SYMBOL) {
    if (type === APITypes.DataTypes.CHANNEL) {
      return createObject(
        await rest.request(
          "GET",
          `/channels/${id}`,
          true,
        ),
        APITypes.DataTypes.CHANNEL,
      );
    } else if (type === APITypes.DataTypes.USER) {
      return createObject(
        await rest.request(
          "GET",
          `/users/${id}`,
          true,
        ),
        APITypes.DataTypes.USER,
      );
    } else if (type === APITypes.DataTypes.GUILD) {
      return createObject(
        await rest.request(
          "GET",
          `/guilds/${id}`,
          true,
        ),
        APITypes.DataTypes.GUILD,
      );
    } else if (type === APITypes.DataTypes.INVITE) {
      return createObject(
        await rest.request(
          "GET",
          `/invites/${id}`,
          true,
        ),
        APITypes.DataTypes.INVITE,
      );
    } else if (type === APITypes.DataTypes.WEBHOOK) {
      return createObject(
        await rest.request(
          "GET",
          `/webhooks/${id}${options ? `/${options}` : ""}`,
          !options,
        ),
        APITypes.DataTypes.WEBHOOK,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.GUILD) {
    if (type === APITypes.DataTypes.WEBHOOK) {
      return rest.request(
        "GET",
        `/guilds/${parent.id}/webhooks`,
        true,
      ).then((wh) =>
        wh.map((obj: APITypes.APIWebhook) =>
          createObject(obj, APITypes.DataTypes.WEBHOOK)
        )
      );
    } else if (type === APITypes.DataTypes.CHANNEL) {
      return rest.request(
        "GET",
        `/guilds/${parent.id}/channels`,
        true,
      ).then((c) =>
        c.map((obj: APITypes.APIChannel) =>
          createObject(obj, APITypes.DataTypes.CHANNEL)
        )
      );
    } else if (type === APITypes.DataTypes.MEMBER) {
      return createObject(
        await rest.request(
          "GET",
          `/guilds/${parent.id}/members/${id}`,
          true,
        ),
        APITypes.DataTypes.MEMBER,
      );
    } else if (type === APITypes.DataTypes.ROLE) {
      return rest.request(
        "GET",
        `/guilds/${parent.id}/roles`,
        true,
      ).then((r) =>
        r.map((obj: APITypes.APIRole) =>
          createObject(obj, APITypes.DataTypes.ROLE)
        )
      );
    } else if (type === APITypes.DataTypes.INVITE) {
      return rest.request(
        "GET",
        `/guilds/${parent.id}/invites`,
        true,
      ).then((i) =>
        i.map((obj: APITypes.APIInvite) =>
          createObject(obj, APITypes.DataTypes.INVITE)
        )
      );
    } else if (type === APITypes.DataTypes.EMOJI) {
      return rest.request(
        "GET",
        `/guilds/${parent.id}/emojis/${id}`,
        true,
      ).then((obj: APITypes.APIEmoji) =>
        createObject(obj, APITypes.DataTypes.EMOJI)
      );
    } else if (type === APITypes.DataTypes.INTEGRATION) {
      return rest.request(
        "GET",
        `/guilds/${parent.id}/integrations`,
        true,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.CHANNEL) {
    if (type === APITypes.DataTypes.WEBHOOK) {
      return rest.request(
        "GET",
        `/channels/${parent.id}/webhooks`,
        true,
      ).then((wh) =>
        wh.map((obj: APITypes.APIWebhook) =>
          createObject(obj, APITypes.DataTypes.WEBHOOK)
        )
      );
    } else if (type === APITypes.DataTypes.MESSAGE) {
      return createObject(
        await rest.request(
          "GET",
          `/channels/${parent.id}/messages/${id}`,
          true,
        ),
        APITypes.DataTypes.MESSAGE,
      );
    } else if (type === APITypes.DataTypes.INVITE) {
      return rest.request(
        "GET",
        `/channels/${parent.id}/invites`,
        true,
      ).then((i) =>
        i.map((obj: APITypes.APIInvite) =>
          createObject(obj, APITypes.DataTypes.INVITE)
        )
      );
    }
  }
}

/**
 * Gets a list of the guild members from a Discord guild
 * @param parent The guild to get the member list from
 * @param options Options for the fetched member list
 */
get.guildMembers = function (
  parent: ObjectOrType<APITypes.Guild>,
  options?: APITypes.RESTGetAPIGuildMembersQuery,
): Promise<APITypes.GuildMember[]> {
  return rest.request(
    "GET",
    `/guilds/${parent.id}/members`,
    true,
    options,
  ).then((m) =>
    m.map((obj: APITypes.APIGuildMember) =>
      createObject(obj, APITypes.DataTypes.MEMBER)
    )
  );
};

/**
 * Get a ban of a certain user from a Discord guild
 * @param parent The guild to get the ban from
 * @param user The user to look the ban up for
 */
async function getBan(
  parent: ObjectOrType<APITypes.Guild>,
  user: ObjectOrType<APITypes.User>,
): Promise<APITypes.Ban>;
/**
 * Get a list of bans in a Discord guild
 * @param parent The guild to get the ban list from
 */
async function getBan(
  parent: ObjectOrType<APITypes.Guild>,
): Promise<APITypes.Ban[]>;
async function getBan(
  parent: ObjectOrType<APITypes.Guild>,
  user?: ObjectOrType<APITypes.User>,
): Promise<any> {
  const ban = await rest.request(
    "GET",
    `/guilds/${parent.id}/bans${user ? `/${user}` : ""}`,
    true,
  );

  if (Array.isArray(ban)) {
    return ban.map((ban: APITypes.APIBan) => ({
      ...ban,
      user: createObject(ban.user, APITypes.DataTypes.USER),
    }));
  } else {
    return {
      ...ban,
      user: createObject(ban.user, APITypes.DataTypes.USER),
    };
  }
}

get.ban = getBan;

/**
 * Get a list of messages in a Discord channel
 * @param parent The channel to get the messages from
 * @param options Options for fetching the messages
 */
get.messages = function (
  parent: ObjectOrType<APITypes.Channel>,
  options?: APITypes.RESTGetAPIChannelMessagesQuery,
): Promise<APITypes.Message[]> {
  return rest.request(
    "GET",
    `/channels/${parent.id}/messages`,
    true,
    options,
  ).then((msg) =>
    msg.map((m: APITypes.APIMessage) =>
      createObject(m, APITypes.DataTypes.MESSAGE)
    )
  );
};

/**
 * Gets a list of pinned messages in a channel
 * @param parent The channel to get the pinned messages from
 */
get.pinnedMessages = function (
  parent: ObjectOrType<APITypes.Channel>,
): Promise<APITypes.Message[]> {
  return rest.request(
    "GET",
    `/channels/${parent.id}/pins`,
    true,
  ).then((msg) =>
    msg.map((m: APITypes.APIMessage) =>
      createObject(m, APITypes.DataTypes.MESSAGE)
    )
  );
};

/**
 * Get a list of users who reacted on a Discord message
 * @param channel The channel the message is in
 * @param parent The message to get the reactions from
 * @param emoji The emoji - should be either a custom emoji in format of `name:id` or an Unicode emoji
 * @param options The options for fetching the reactions
 */
get.reactions = function (
  channel: ObjectOrType<APITypes.Channel>,
  parent: ObjectOrType<APITypes.Message>,
  emoji: string,
  options?: APITypes.RESTGetAPIChannelMessageReactionsQuery,
): Promise<APITypes.User[]> {
  return rest.request(
    "GET",
    `/channels/${channel.id}/messages/${parent.id}/reactions/${
      encodeURIComponent(emoji)
    }`,
    true,
    options,
  ).then((msg) =>
    msg.map((user: APITypes.APIUser) =>
      createObject(user, APITypes.DataTypes.USER)
    )
  );
};

/**
 * Gets an audit log of a guild
 * @param guild The guild to get the audit log from
 * @param options The options for querying the audit log
 */
get.auditLog = async function (
  guild: ObjectOrType<APITypes.Guild>,
  options?: APITypes.RESTGetAPIAuditLogQuery,
): Promise<
  APITypes.APIAuditLog & {
    webhooks: APITypes.Webhook[];
    users: APITypes.User[];
  }
> {
  const log: APITypes.APIAuditLog = await rest.request(
    "GET",
    `/guilds/${guild.id}/audit-logs`,
    true,
    options,
  );

  // TODO(TTtie): Should we bother data-typing audit log changes?
  return {
    ...log,
    webhooks: log.webhooks.map((w) =>
      createObject(w, APITypes.DataTypes.WEBHOOK)
    ),
    users: log.users.map((u) => createObject(u, APITypes.DataTypes.USER)),
  };
};

/**
 * Gets a vanity URL of a guild
 * @param guild The guild to get the vanity URL from
 */
get.vanityURL = function (
  guild: ObjectOrType<APITypes.Guild>,
): Promise<APITypes.RESTGetAPIGuildVanityUrlResult> {
  return rest.request(
    "GET",
    `/guilds/${guild.id}/vanity-url`,
    true,
  );
};

/**
 * Gets the gateway URL along with information related to current bot
 */
function getGateway(
  withBotInfo: true,
): Promise<APITypes.RESTGetAPIGatewayBotResult>;
/**
 * Gets the gateway URL
 */
function getGateway(
  withBotInfo?: false,
): Promise<APITypes.RESTGetAPIGatewayResult>;
function getGateway(
  withBotInfo: boolean = false,
): Promise<APITypes.RESTGetAPIGatewayResult> {
  return rest.request(
    "GET",
    `/gateway${withBotInfo ? "/bot" : ""}`,
    true,
  );
}

get.gateway = getGateway;

/**
 * Lists available voice regions
 * @param guild If passed, will list voice regions available for that specific guild
 */
get.voiceRegions = function (
  guild?: ObjectOrType<APITypes.Guild>,
): Promise<APITypes.APIVoiceRegion[]> {
  return rest.request(
    "GET",
    guild ? `/guilds/${guild.id}/regions` : "/voice/regions",
    true,
  );
};

/**
 * Gets information about the current OAuth2 application
 */
get.appInfo = async function (): Promise<APITypes.APIApplication> {
  return rest.request(
    "GET",
    `/oauth2/applications/@me`,
    true,
  );
};

/**
 * Calculates the amount of members that would've been pruned according to the passed options
 * @param guild The guild to calculate the pruned members for
 * @param options The options for calculating the prune
 */
get.prune = function (
  guild: ObjectOrType<APITypes.Guild>,
  options: APITypes.PruneOptions,
): Promise<APITypes.RESTGetAPIGuildPruneCountResult> {
  const opts = {
    ...options,
    include_roles: options.include_roles && options.include_roles.join(","),
  };

  if (!options.include_roles) delete opts.include_roles;
  return rest.request(
    "GET",
    `/guilds/${guild.id}/prune`,
    true,
    opts,
  );
};

/**
 * Gets the guild widget settings for a guild
 * @param guild The guild to get the widget settings for
 */
get.widget = function (
  guild: ObjectOrType<APITypes.Guild>,
): Promise<APITypes.RESTGetAPIGuildWidgetSettingsResult> {
  return rest.request(
    "GET",
    `/guilds/${guild.id}/widget`,
    true,
  );
};

/**
 * Get a list of the emoji in a guild
 * @param guild The guild to get the emoji list for
 */
get.emojis = function (
  guild: ObjectOrType<APITypes.Guild>,
): Promise<APITypes.Emoji[]> {
  return rest.request(
    "GET",
    `/guilds/${guild.id}/emojis`,
    true,
  ).then((emoji: APITypes.APIEmoji[]) =>
    emoji.map((e) => createObject(e, APITypes.DataTypes.EMOJI))
  );
};

/**
 * Gets a guild preview
 * @param guild The guild to fetch the preview for
 */
get.preview = function (
  guild: ObjectOrType<APITypes.Guild>,
): Promise<APITypes.APIGuildPreview> {
  return rest.request(
    "GET",
    `/guilds/${guild.id}/preview`,
    true,
  );
};
//#endregion get(...)

//#region remove(...)
/**
 * Deletes/leaves a guild
 * @param object The guild to delete/leave
 * @param deleteGuild Whether to delete the guild as a whole or only leave it. Defaults to false (leaving the server only)
 */
export async function remove(
  _: typeof ROOT_SYMBOL,
  object: ObjectOrType<APITypes.Guild>,
  deleteGuild?: boolean,
): Promise<void>;
/**
 * Deletes an invite
 * @param obj The invite to delete
 * @param reason The reason for deleting the invite
 */
export async function remove(
  _: typeof ROOT_SYMBOL,
  obj: APITypes.Invite | {
    code: string;
    [APITypes.DATA_SYMBOL]: APITypes.DataTypes.INVITE;
  },
  reason?: string,
): Promise<void>;
/**
 * Deletes a webhook
 * @param obj The webhook to delete
 * @param options The options for deleting the webhook
 */
export async function remove(
  _: typeof ROOT_SYMBOL,
  obj: ObjectOrType<APITypes.Webhook>,
  options?: WebhookRemoveOptions,
): Promise<void>;
/**
 * Deletes a message
 * @param parent The channel to delete the message from
 * @param obj The message to delete
 * @param reason The reason for deleting the message
 */
export async function remove(
  parent: ObjectOrType<APITypes.Channel>,
  obj: ObjectOrType<APITypes.Message>,
  reason?: string,
): Promise<void>;
/**
 * Removes (kicks) a member
 * @param parent The guild to remove the member from
 * @param obj The member to remove
 * @param reason The reason for removing the member
 */
export async function remove(
  parent: ObjectOrType<APITypes.Guild>,
  obj: ObjectOrType<APITypes.GuildMember>,
  reason?: string,
): Promise<void>;
export async function remove(
  parent: ObjectOrType<APITypes.Guild>,
  obj: ObjectOrType<
    APITypes.Emoji & {
      id: string;
    }
  >,
  reason?: string,
): Promise<void>;
/**
 * Deletes a role
 * @param parent The guild to delete the role from
 * @param obj The role to delete
 * @param reason The reason for deleting the role
 */
export async function remove(
  parent: ObjectOrType<APITypes.Channel>,
  obj: ObjectOrType<APITypes.Message>,
  reason?: string,
): Promise<void>;
export async function remove(
  parent: ParentObject,
  object: TypeByID<APITypes.DataTypes> | APITypes.Invite | APITypes.GuildMember,
  options?: any,
): Promise<void> {
  if (parent === ROOT_SYMBOL) {
    if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.GUILD) {
      if (options) {
        await rest.request(
          "DELETE",
          `/guilds/${(<TypeByID<APITypes.DataTypes>> object).id}`,
          true,
        );
      } else {
        await rest.request(
          "DELETE",
          `/users/@me/guilds/${(<TypeByID<APITypes.DataTypes>> object).id}`,
          true,
        );
      }
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.INVITE) {
      await rest.request(
        "DELETE",
        `/invites/${(<APITypes.Invite> object).code}`,
        true,
        {
          reason: options.toString(),
        },
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.WEBHOOK) {
      await rest.request(
        "DELETE",
        `/webhooks/${(<TypeByID<APITypes.DataTypes>> object).id}${
          options.token ? `/${options.token}` : ""
        }`,
        !options.token,
        {
          reason: options.reason?.toString(),
        },
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.CHANNEL) {
      await rest.request(
        "DELETE",
        `/channels/${(<TypeByID<APITypes.DataTypes>> object).id}`,
        true,
        {
          reason: options.toString(),
        },
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.CHANNEL) {
    if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.MESSAGE) {
      await rest.request(
        "DELETE",
        `/channels/${parent.id}/messages/${
          (<TypeByID<APITypes.DataTypes>> object).id
        }`,
        true,
        {
          reason: options.toString(),
        },
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.GUILD) {
    if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.MEMBER) {
      await rest.request(
        "DELETE",
        `/guilds/${parent.id}/members/${
          (<TypeByID<APITypes.DataTypes>> object).id
        }`,
        true,
        {
          reason: options.toString(),
        },
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.ROLE) {
      await rest.request(
        "DELETE",
        `/guilds/${parent.id}/roles/${(<APITypes.GuildMember> object).user
          ?.id || (<TypeByID<APITypes.DataTypes>> object).id}`,
        true,
        {
          reason: options.toString(),
        },
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.EMOJI) {
      await rest.request(
        "DELETE",
        `/guilds/${parent.id}/emojis/${
          (<TypeByID<APITypes.DataTypes>> object).id
        }`,
        true,
        {
          reason: options.toString(),
        },
      );
    }
  }
}

/**
 * Deletes multiple messages at once
 * @param parent The channel to delete the messages from
 * @param messages The messages to delete
 * @param reason The reason for deleting the messages
 */
remove.messages = async function (
  parent: ObjectOrType<APITypes.Channel>,
  messages: (string | ObjectOrType<APITypes.Message>)[],
  reason?: string,
) {
  await rest.request(
    "POST",
    `/channels/${parent.id}/messages/bulk-delete`,
    true,
    {
      reason,
      messages: messages.map((s) => typeof s === "string" ? s : s.id),
    },
  );
};

/**
 * Unbans a user from a guild
 * @param parent The guild to unban the user from
 * @param user The user to unban
 * @param reason The reason for unbanning the user
 */
remove.ban = async function (
  parent: ObjectOrType<APITypes.Guild>,
  user: ObjectOrType<APITypes.User>,
  reason?: string,
) {
  await rest.request(
    "DELETE",
    `/guilds/${parent.id}/bans/${user.id}`,
    true,
    {
      reason,
    },
  );
};

/**
 * Removes all reactions from a message
 * @param channel The channel the message is in
 * @param message The channel to remove the reactions from
 */
async function removeReaction(
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
): Promise<void>;
/**
 * Removes all reactions from a message for a specified emoji
 * @param channel The channel the message is in
 * @param message The channel to remove the reactions from
 * @param emoji The emoji to remove
 */
async function removeReaction(
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
  emoji: string,
): Promise<void>;
/**
 * Removes all reactions from a message for a specified emoji for a specified user
 * @param channel The channel the message is in
 * @param message The channel to remove the reactions from
 * @param emoji The emoji to remove
 * @param user The user to remove the reaction for. Pass a user with ID of "@me" to use the authenticated user.
 */
async function removeReaction(
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
  emoji: string,
  user: ObjectOrType<APITypes.User>,
): Promise<void>;
async function removeReaction(
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
  emoji?: string,
  user?: ObjectOrType<APITypes.User>,
): Promise<void> {
  if (emoji) {
    const baseURL = `/channels/${channel.id}/messages/${message.id}/reactions/${
      encodeURIComponent(emoji)
    }`;
    if (!user) {
      await rest.request(
        "DELETE",
        baseURL,
        true,
      );
    } else {
      await rest.request(
        "DELETE",
        `${baseURL}/${user.id}`,
        true,
      );
    }
  } else {
    await rest.request(
      "DELETE",
      `/channels/${channel.id}/messages/${message.id}/reactions`,
      true,
    );
  }
}

remove.reaction = removeReaction;

/**
 * Unpins a message
 * @param channel The channel the message is in
 * @param message The message to unpin
 * @param reason The reason for unpinning the message
 */
remove.pin = async function (
  channel: ObjectOrType<APITypes.Channel>,
  message: ObjectOrType<APITypes.Message>,
  reason?: string,
): Promise<void> {
  await rest.request(
    "DELETE",
    `/channels/${channel.id}/pins/${message.id}`,
    true,
    {
      reason,
    },
  );
};

/**
 * Removes (prunes) inactive members in a guild
 * Unstable: this function may probably get moved somewhere else
 * @param guild The guild to prune the members in
 * @param options Options for pruning the members. It is recommended to set `compute_prune_count` to false on large servers.
 */
remove.members = async function (
  guild: ObjectOrType<APITypes.Guild>,
  options: WithReason<APITypes.RESTPostAPIGuildPruneJSONBody>,
): Promise<APITypes.RESTPostAPIGuildPruneResult> {
  return rest.request(
    "POST",
    `/guilds/${guild.id}/prune`,
    true,
    options,
  );
};
//#endregion remove(...)

//#region modify(...)
/**
 * Modifies a channel
 * @param object The channel to modify
 * @param options The options for modifying the channel
 */
export async function modify(
  parent: typeof ROOT_SYMBOL,
  object: ObjectOrType<APITypes.Channel>,
  options?: WithReason<APITypes.RESTPatchAPIChannelJSONBody>,
): Promise<APITypes.Channel>;

/**
 * Modifies a guild
 * @param object The guild to modify
 * @param options The options for modifying the guild
 */
export async function modify(
  parent: typeof ROOT_SYMBOL,
  object: ObjectOrType<APITypes.Guild>,
  options?: WithReason<APITypes.RESTPatchAPIGuildJSONBody>,
): Promise<APITypes.Guild>;

/**
 * Modifies the current user
 * @param object Included only for consistency. Has no effect.
 * @param options The options for modifying the current user
 */
export async function modify(
  parent: typeof ROOT_SYMBOL,
  object: ObjectOrType<APITypes.User> & {
    id: "@me";
  },
  options?: APITypes.RESTPatchAPICurrentUserJSONBody,
): Promise<APITypes.User>;

// TODO(TTtie): Wrap ops that require tokens now or after all of REST is done?
/* *
 * Modifies a webhook
 * @param object The webhook to modify
 * @param options Options for modifying the webhook
 */
/*export async function modify(
  parent: typeof ROOT_SYMBOL,
  object: ObjectOrType<APITypes.Webhook>,
  options: 
): Promise<APITypes.Webhook>;*/

/**
 * Modifies (edits) a message
 * @param parent The channel the message is in
 * @param object The message to modify
 * @param options The options for modifying the message
 */
export async function modify(
  parent: ObjectOrType<APITypes.Channel>,
  object: ObjectOrType<APITypes.Message>,
  options?: APITypes.RESTPatchAPIChannelMessageJSONBody,
): Promise<APITypes.Message>;

/**
 * Modifies a guild role
 * @param parent The guild the role is in
 * @param object The role to modify
 * @param options The options for modifying the role
 */
export async function modify(
  parent: ObjectOrType<APITypes.Guild>,
  object: ObjectOrType<APITypes.Role>,
  options?: APITypes.RESTPatchAPIGuildRoleJSONBody,
): Promise<APITypes.Role>;

/**
 * Modifies a guild member
 * @param parent The guild the member is in
 * @param object The guild member - the object must have either a `user` property with an ID or the `id` property directly on the object.
 * @param options The options for modifying the guild member
 */
export async function modify(
  parent: ObjectOrType<APITypes.Guild>,
  object:
    | (APITypes.GuildMember & {
      id: string;
    })
    | TypeByID<APITypes.DataTypes.MEMBER>,
  options?: APITypes.RESTPatchAPIGuildMemberJSONBody,
): Promise<void>;

/**
 * Modifies a webhook using the current bot token
 * Unstable - the API may be subject to change.
 * @param object The webhook to modify
 * @param options The options for modifying the webhook
 */
export async function modify(
  parent: typeof ROOT_SYMBOL,
  object: ObjectOrType<APITypes.Webhook>,
  options?: APITypes.RESTPatchAPIWebhookJSONBody & {
    withToken?: false;
  },
): Promise<APITypes.Webhook>;
/**
 * Modifies a webhook using the webhook's token
 * Unstable - the API may be subject to change.
 * @param object The webhook to modify
 * @param options The options for modifying the webhook
 */
export async function modify(
  parent: typeof ROOT_SYMBOL,
  object: ObjectOrType<APITypes.Webhook>,
  options?: APITypes.RESTPatchAPIWebhookWithTokenJSONBody & {
    withToken: true;
  },
): Promise<
  APITypes.RESTPatchAPIWebhookWithTokenResult & {
    [APITypes.DATA_SYMBOL]: APITypes.DataTypes.WEBHOOK;
  }
>;
/**
 * Modifies a guild emoji
 * @param parent The guild the emoji is in
 * @param object The emoji to modify
 * @param options The options for modifying the emoji
 */
export async function modify(
  parent: ObjectOrType<APITypes.Guild>,
  object: ObjectOrType<
    APITypes.Emoji & {
      id: string;
    }
  >,
  options: WithReason<APITypes.RESTPatchAPIGuildEmojiJSONBody>,
): Promise<APITypes.Emoji>;
export async function modify(
  parent: ParentObject,
  object: TypeByID<APITypes.DataTypes> | APITypes.GuildMember,
  options?: any,
): Promise<TypeByID<APITypes.DataTypes> | APITypes.Emoji | void> {
  if (parent === ROOT_SYMBOL) {
    if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.CHANNEL) {
      return createObject(
        await rest.request(
          "PATCH",
          `/channels/${(<TypeByID<APITypes.DataTypes>> object).id}`,
          true,
          options,
        ),
        APITypes.DataTypes.CHANNEL,
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.GUILD) {
      return createObject(
        await rest.request(
          "PATCH",
          `/guilds/${(<TypeByID<APITypes.DataTypes>> object).id}`,
          true,
          options,
        ),
        APITypes.DataTypes.GUILD,
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.USER) {
      if ((<TypeByID<APITypes.DataTypes>> object).id !== "@me") {
        throw new Error("Only the current user (@me) can be modified");
      }
      return createObject(
        await rest.request(
          "PATCH",
          `/users/@me`,
          true,
          options,
        ),
        APITypes.DataTypes.USER,
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.WEBHOOK) {
      const { withToken } = options;
      delete options?.withToken;
      return createObject(
        await rest.request(
          "PATCH",
          `/webhooks/${(<TypeByID<APITypes.DataTypes>> object).id}${
            withToken ? `/${(<APITypes.Webhook> object).token}` : ""
          }`,
          !withToken,
          options,
        ),
        APITypes.DataTypes.WEBHOOK,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.CHANNEL) {
    if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.MESSAGE) {
      return createObject(
        await rest.request(
          "PATCH",
          `/channels/${parent.id}/messages/${
            (<TypeByID<APITypes.DataTypes>> object).id
          }`,
          true,
          options,
        ),
        APITypes.DataTypes.MESSAGE,
      );
    }
  } else if (parent[APITypes.DATA_SYMBOL] === APITypes.DataTypes.GUILD) {
    if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.ROLE) {
      return createObject(
        await rest.request(
          "PATCH",
          `/guilds/${parent.id}/roles/${
            (<TypeByID<APITypes.DataTypes>> object).id
          }`,
          true,
          options,
        ),
        APITypes.DataTypes.ROLE,
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.MEMBER) {
      await rest.request(
        "PATCH",
        `/guilds/${parent.id}/members/${(<APITypes.GuildMember> object).user
          ?.id || (<TypeByID<APITypes.DataTypes>> object).id}`,
        true,
        options,
      );
    } else if (object[APITypes.DATA_SYMBOL] === APITypes.DataTypes.EMOJI) {
      return rest.request(
        "PATCH",
        `/guilds/${parent.id}/emojis/${
          (<TypeByID<APITypes.DataTypes>> object).id
        }`,
        true,
        options,
      ).then((emoji: APITypes.APIEmoji) =>
        createObject(emoji, APITypes.DataTypes.EMOJI)
      );
    }
  }
}

/**
 * Sets a nickname for the current user in a guild
 * @param guild The guild to set a new nickname in
 * @param nick The new nickname or undefined/null to remove
 */
modify.nick = function (
  guild: ObjectOrType<APITypes.Guild>,
  nick?: string | null,
): Promise<APITypes.RESTPatchAPICurrentGuildMemberNicknameResult> {
  return rest.request(
    "PATCH",
    `/guilds/${guild.id}/@me/nick`,
    true,
    {
      nick: nick?.toString() ?? null,
    },
  );
};

modify.widget = function (
  guild: ObjectOrType<APITypes.Guild>,
  options?: APITypes.RESTPatchAPIGuildWidgetSettingsJSONBody,
) {
  return rest.request(
    "PATCH",
    `/guilds/${guild.id}/widget`,
    true,
    options,
  );
};

/**
 * Functions for dealing with member roles.
 * API subject to change.
 */
modify.memberRoles = {
  /**
   * Adds a member to a role
   * @param guild The guild the member is in
   * @param member The member to add the role on
   * @param role The role to add
   */
  async add(
    guild: ObjectOrType<APITypes.Guild>,
    member: ObjectOrType<APITypes.GuildMember> | APITypes.GuildMember,
    role: ObjectOrType<APITypes.Role>,
  ): Promise<void> {
    await rest.request(
      "PUT",
      `/guilds/${guild.id}/members/${(<TypeByID<APITypes.DataTypes>> member)
        .id || (<APITypes.GuildMember> member).user?.id}/roles/${role.id}`,
      true,
    );
  },

  /**
   * Removes a role from a member
   * @param guild The guild the member is in
   * @param member The member to remove the role from
   * @param role The role to remove
   */
  async remove(
    guild: ObjectOrType<APITypes.Guild>,
    member: ObjectOrType<APITypes.GuildMember> | APITypes.GuildMember,
    role: ObjectOrType<APITypes.Role>,
  ): Promise<void> {
    await rest.request(
      "DELETE",
      `/guilds/${guild.id}/members/${(<TypeByID<APITypes.DataTypes>> member)
        .id || (<APITypes.GuildMember> member).user?.id}/roles/${role.id}`,
      true,
    );
  },
};

//#endregion modify(...)
export { setAPIBase } from "./lib/util/constants.ts";
