import { APITypes } from "../deps.ts";
const makeErrorExclusive = (field: string) =>
  new Error(
    `The "${field}" type in the "parse" field and the "${field}" field are mutually exclusive`,
  );
const makeErrorTooMuch = (field: string) =>
  new Error(`You can allow mentions for at most 100 ${field} at once`);

export default function checkAllowedMentions(
  mentions?: APITypes.APIAllowedMentionsSend,
): void {
  if (!mentions) return;
  if (
    mentions.parse?.includes(APITypes.AllowedMentionsTypes.User) &&
    mentions.users
  ) {
    throw makeErrorExclusive("users");
  }
  if (
    mentions.parse?.includes(APITypes.AllowedMentionsTypes.Role) &&
    mentions.roles
  ) {
    throw makeErrorExclusive("roles");
  }
  if ((mentions.users?.length ?? 0) > 100) {
    throw makeErrorTooMuch("users");
  }
  if ((mentions.roles?.length ?? 0) > 100) {
    throw makeErrorTooMuch("roles");
  }
}
