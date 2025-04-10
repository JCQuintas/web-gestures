type StatefulKeys<T extends string> = `${T}Start` | T | `${T}End` | `${T}Cancel`;

/**
 * StatefulEventMap<T> maps the keys of T to a new type where each key is transformed
 * to include the stateful keys. For example, if T has a key 'pan', the resulting
 * type will have keys 'panStart', 'pan', 'panEnd', and 'panCancel'.
 */
export type StatefulEventMap<T> = {
  [K in keyof T as StatefulKeys<string & K>]: T[K];
};
