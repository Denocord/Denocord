import RequestHandler from "./lib/rest/request_handler.ts";
import { APITypes } from "./lib/deps.ts";
import createObject from "./lib/util/create_object.ts";
import validateAllowedMentions from "./lib/util/allowed_mentions.ts";
const rest = RequestHandler.get();

type TypeByID<T extends APITypes.DataTypes> = {
  id: string;
  [APITypes.DATA_SYMBOL]: T;
};

type ParentObject = TypeByID<APITypes.DataTypes> | typeof ROOT_SYMBOL;

export default rest;

export const ROOT_SYMBOL = Symbol("Denocord::DataRoot");

//#region create(...)

/**
 * Creates a message in the specified channel
 * @param parent The channel to create the message in
 * @param payload The message content
 */
export function create(
  parent: APITypes.Channel | TypeByID<APITypes.DataTypes.CHANNEL>,
  type: APITypes.DataTypes.MESSAGE,
  payload: APITypes.MessageCreatePayload,
): Promise<APITypes.Message>;
/**
 * Creates a invite in the specified channel
 * @param parent The channel to create the invite in
 * @param payload The properties of new invite
 */
export function create(
  parent: APITypes.Channel | TypeByID<APITypes.DataTypes.CHANNEL>,
  type: APITypes.DataTypes.INVITE,
  payload?: APITypes.RESTPostAPIChannelInviteJSONBody,
): Promise<APITypes.Invite>;
/**
 * Creates a webhook in the specified channel
 * @param parent The channel to create the webhook in
 * @param payload The webhook data
 */
export function create(
  parent: APITypes.Channel | TypeByID<APITypes.DataTypes.CHANNEL>,
  type: APITypes.DataTypes.WEBHOOK,
  payload: APITypes.RESTPostAPIChannelWebhookJSONBody,
): Promise<APITypes.Webhook>;
/**
 * Creates a private message channel with a user
 * @param parent The user to create the DM channel for 
 */
export function create(
  parent: APITypes.User | TypeByID<APITypes.DataTypes.USER>,
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
export async function create(
  parent: ParentObject,
  type: APITypes.DataTypes,
  payload: any,
): Promise<any> {
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
  }
}

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
  __?: void,
): Promise<APITypes.Channel>;
/**
 * Gets a user from Discord
 * @param id The user ID. To fetch authenticated user, use "@me"
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.USER,
  id: string,
  __?: void,
): Promise<APITypes.User>;
/**
 * Gets a guild from Discord
 * @param id The guild ID
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.GUILD,
  id: string,
  __?: void,
): Promise<APITypes.Guild>;
/**
 * Gets an invite from Discord
 * @param id The invite code
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.INVITE,
  code: string,
  __?: void,
): Promise<APITypes.Invite>;
/**
 * Gets a webhook from from Discord
 * @param id The webhook ID
 */
export function get(
  _: typeof ROOT_SYMBOL,
  type: APITypes.DataTypes.WEBHOOK,
  code: string,
  __?: void,
): Promise<APITypes.Webhook>;

/**
 * Gets a list of channels from a Discord guild
 * @param parent The guild
 */
export function get(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
  type: APITypes.DataTypes.CHANNEL,
  _?: string,
  __?: void,
): Promise<APITypes.Channel[]>;
/**
 * Gets a list of roles from a Discord guild
 * @param parent The guild
 */
export function get(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
  type: APITypes.DataTypes.ROLE,
  _?: string,
  __?: void,
): Promise<APITypes.Role[]>;
/**
 * Gets a list of webhooks from a Discord guild
 * @param parent The guild
 */
export function get(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
  type: APITypes.DataTypes.WEBHOOK,
  _?: string,
  __?: void,
): Promise<APITypes.Webhook[]>;
/**
 * Gets a list of invites from a Discord guild
 * @param parent The guild
 */
export function get(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
  type: APITypes.DataTypes.INVITE,
  _?: string,
  __?: void,
): Promise<APITypes.Invite[]>;
/**
 * Gets a specific member from a Discord guild
 * @param parent The guild
 * @param id The ID of the member
 */
export function get(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
  type: APITypes.DataTypes.INVITE,
  id: string,
  __?: void,
): Promise<APITypes.GuildMember>;
export async function get(
  parent: ParentObject,
  type: APITypes.DataTypes,
  id?: string,
  options?: any,
): Promise<any> {
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
          `/webhooks/${id}`,
          true,
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
    }
  }
}

/**
 * Gets a list of the guild members from a Discord guild
 * @param parent The guild
 * @param options Options for the fetched member list
 */
get.guildMembers = function (
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
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


async function getBan(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
  user: APITypes.User | TypeByID<APITypes.DataTypes.USER>
): Promise<APITypes.Ban>;
async function getBan(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
): Promise<APITypes.Ban[]>
async function getBan(
  parent: APITypes.Guild | TypeByID<APITypes.DataTypes.GUILD>,
  user?: APITypes.User | TypeByID<APITypes.DataTypes.USER>
): Promise<any> {
  const ban = await rest.request("GET",
    `/guilds/${parent.id}/bans${user ? `/${user}` : ""}`,
    true)

  if (Array.isArray(ban)) {
    return ban.map((ban: APITypes.APIBan) => ({
      ...ban,
      user: createObject(ban.user, APITypes.DataTypes.USER)
    }))
  } else {
    return {
      ...ban,
      user: createObject(ban.user, APITypes.DataTypes.USER)
    };
  }
}

get.ban = getBan;
//#endregion get(...)

export { setAPIBase } from "./lib/util/constants.ts";
