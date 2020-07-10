import User from "./User.ts";

export default interface ExtendedUser extends User {
  mfa_enabled?: boolean;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
}
