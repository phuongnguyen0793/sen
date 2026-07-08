import { en } from './en';

type Stringify<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: Stringify<T[K]> }
    : T;

export type Messages = Stringify<typeof en>;
