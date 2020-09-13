import type { StrictEE } from "./util/type_utils.ts";
import { EventEmitter, APITypes } from "./deps.ts";

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

/**
 * This should be rather an user provided class 
 */
export const state = new class State {
  public readonly user!: APITypes.User;
  public readonly guilds!: Map<
    string,
    APITypes.Guild | {
      id: string;
      unavailable: true;
      [APITypes.DATA_SYMBOL]: APITypes.DataTypes.GUILD;
    }
  >;
}();

export function config(options: ClientConfig) {}

export function setToken(newToken: string) {
  token = newToken;
}
