import { EventEmitter, StrictEventEmitter } from "../deps.ts";

interface ClientEvents {
  debug: string;
}

type StrictEECtor = { new (): StrictEventEmitter<EventEmitter, ClientEvents> };

class Client extends (EventEmitter as StrictEECtor) {
  public token?: string;

  public getOrCreate() {}

  private constructor() {
    super();
  }

  public login(token: string) {
    this.emit("debug", "Logging in.");
    this.token = token;
  }
}

export default Client;
