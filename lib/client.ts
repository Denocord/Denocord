import { StrictEE } from "./util/type_utils.ts";
import { EventEmitter } from "./deps.ts";
import ExtendedUser from "./structures/ExtendedUser.ts";

interface ClientEvents {
  debug: string;
  error: Error;
}

// NOTE: DO NOT PUT INTENTS OR WS OR REST STUFF HERE!!!
// There will be a configure function for the ws
export interface ClientConfig {
  someOption?: boolean;
}

export let token!: string;
export let options!: ClientConfig;

export const bus = new EventEmitter() as StrictEE<ClientEvents>;

export const state = new class State {
  public readonly user!: ExtendedUser;
  public readonly guilds!: Map<string, any>;
}();

export function config(options: ClientConfig) {}

export function setToken(newToken: string) {
  token = newToken;
}
