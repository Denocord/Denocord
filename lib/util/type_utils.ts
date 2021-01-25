import type { StrictEventEmitter } from "../deps.ts";
import type { EventEmitter } from "../deps.ts";

export type Asyncable<T> = Promise<T> | T;
export type StrictEE<E> = StrictEventEmitter<EventEmitter, E>;
export type Arrayable<T> = T | T[];
