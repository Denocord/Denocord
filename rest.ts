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
  payload?: APITypes.CreateInvitePayload,
): Promise<APITypes.Invite>;
/**
 * Creates a webhook in the specified channel
 * @param parent The channel to create the webhook in
 * @param payload The webhook data
 */
export function create(
  parent: APITypes.Channel | TypeByID<APITypes.DataTypes.CHANNEL>,
  type: APITypes.DataTypes.WEBHOOK,
  payload: APITypes.CreateWebhookPayload,
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
  payload: APITypes.CreateGuildPayload,
): Promise<APITypes.Guild>;
export async function create(
  parent: ParentObject,
  type: APITypes.DataTypes,
  payload: any,
): Promise<any> {
  if (parent === ROOT_SYMBOL) {
    // The thing to create must be determined by type
    if (type === APITypes.DataTypes.GUILD) {
      const p = <APITypes.CreateGuildPayload>payload;
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
      const p = <APITypes.MessageCreatePayload>payload;
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
      const p = <APITypes.CreateWebhookPayload>payload;
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
      const p = <APITypes.CreateInvitePayload>payload || {};
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
  id: string,
  dataType: APITypes.DataTypes.CHANNEL,
  __?: void
): Promise<APITypes.Channel>;
/**
 * Gets a user from Discord
 * @param id The user ID. To fetch authenticated user, use "@me"
 */
export function get(
  _: typeof ROOT_SYMBOL,
  id: string,
  dataType: APITypes.DataTypes.USER,
  __?: void
): Promise<APITypes.User>;
/**
 * Gets a guild from Discord
 * @param id The guild ID
 */
export function get(
  _: typeof ROOT_SYMBOL,
  id: string,
  dataType: APITypes.DataTypes.GUILD,
  __?: void
): Promise<APITypes.Guild>;
/**
 * Gets an invite from Discord
 * @param id The invite code
 */
export function get(
  _: typeof ROOT_SYMBOL,
  code: string,
  dataType: APITypes.DataTypes.INVITE,
  __?: void
): Promise<APITypes.Invite>;
/**
 * Gets a webhook from from Discord
 * @param id The webhook ID
 */
export function get(
  _: typeof ROOT_SYMBOL,
  code: string,
  dataType: APITypes.DataTypes.WEBHOOK,
  __?: void
): Promise<APITypes.Webhook>;
export async function get(parent: ParentObject,
  id: string,
  dataType: APITypes.DataTypes,
  options: any): Promise<any> {
  if (parent === ROOT_SYMBOL) {
    if (dataType === APITypes.DataTypes.CHANNEL) {
      return createObject(
        await rest.request(
          "GET",
          `/channels/${id}`,
          true
        ),
        APITypes.DataTypes.CHANNEL
      );
    } else if (dataType === APITypes.DataTypes.USER) {
      return createObject(
        await rest.request(
          "GET",
          `/users/${id}`,
          true
        ),
        APITypes.DataTypes.USER
      );
    } else if (dataType === APITypes.DataTypes.GUILD) {
      return createObject(
        await rest.request(
          "GET",
          `/guilds/${id}`,
          true
        ),
        APITypes.DataTypes.GUILD
      );
    } else if (dataType === APITypes.DataTypes.INVITE) {
      return createObject(
        await rest.request(
          "GET",
          `/invites/${id}`,
          true
        ),
        APITypes.DataTypes.INVITE
      );
    } else if (dataType === APITypes.DataTypes.WEBHOOK) {
      return createObject(
        await rest.request(
          "GET",
          `/webhooks/${id}`,
          true
        ),
        APITypes.DataTypes.WEBHOOK
      );
    }
  }
}
//#endregion get(...)


export { setAPIBase } from "./lib/util/constants.ts";
