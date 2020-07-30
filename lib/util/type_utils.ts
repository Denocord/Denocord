import { StrictEventEmitter } from "../deps.ts";
import { EventEmitter } from "../deps.ts";

export type Asyncable<T> = Promise<T> | T;
export type StrictEE<E> = StrictEventEmitter<EventEmitter, E>;
