import { StrictEventEmitter } from "../deps.ts";
import { EventEmitter } from "../deps.ts";
import { SnowflakeBase } from "../@types/denocord.ts";

export type Asyncable<T> = Promise<T> | T;
export type StrictEE<E> = StrictEventEmitter<EventEmitter, E>;
export type IDor<T extends SnowflakeBase> = T | SnowflakeBase | string;
