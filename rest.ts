import RequestHandler from "./lib/rest/request_handler.ts";
import { APITypes } from "./lib/deps.ts";
import createObject from "./lib/util/create_object.ts";
import validateAllowedMentions from "./lib/util/allowed_mentions.ts";
const rest = RequestHandler.get();

type TypeByID<T extends APITypes.DataTypes> = {
  id: string;
  [APITypes.DATA_SYMBOL]: T;
};

export default rest;

export const ROOT_SYMBOL = Symbol("Denocord::DataRoot");

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
 * Creates a webhook in the specified channel
 * @param parent The channel to create the webhook in
 * @param payload The webhook data
 */
export function create(
  parent: APITypes.Channel | TypeByID<APITypes.DataTypes.WEBHOOK>,
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
  parent: {
    id: string;
    [APITypes.DATA_SYMBOL]: APITypes.DataTypes;
  } | typeof ROOT_SYMBOL,
  type: APITypes.DataTypes,
  payload: any,
): Promise<any> {
  if (parent === ROOT_SYMBOL) {
    // The thing to create must be determined by type
    if (type === APITypes.DataTypes.GUILD) {
      const p = <APITypes.CreateGuildPayload> payload;
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
      const p = <APITypes.CreateWebhookPayload> payload;
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
