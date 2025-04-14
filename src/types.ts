/**
 * StatefulKeys utility type creates a union of derived keys for gesture states.
 * For any given event name T, it creates four variations representing different states:
 * - `${T}Start`: The beginning of a gesture
 * - `T`: The ongoing/moving state of a gesture
 * - `${T}End`: The successful completion of a gesture
 * - `${T}Cancel`: The interrupted or cancelled state of a gesture
 *
 * @template T - The base event name as a string literal type
 */
export type StatefulKeys<T extends string> = `${T}Start` | T | `${T}End` | `${T}Cancel`;

/**
 * StatefulEventMap transforms an object type by expanding each of its keys into
 * stateful variants (start, ongoing, end, cancel).
 *
 * This type is used to generate complete event maps for gesture handlers while
 * preserving the value types from the original map.
 *
 * @template T - An object type whose keys will be transformed into stateful variants
 *
 * @example
 * ```typescript
 * type GestureEvents = {
 *   pan: { deltaX: number, deltaY: number }
 * }
 *
 * type AllGestureEvents = StatefulEventMap<GestureEvents>;
 * // Results in:
 * // {
 * //   panStart: { deltaX: number, deltaY: number },
 * //   pan: { deltaX: number, deltaY: number },
 * //   panEnd: { deltaX: number, deltaY: number },
 * //   panCancel: { deltaX: number, deltaY: number }
 * // }
 * ```
 */
export type StatefulEventMap<T> = {
  [K in keyof T as StatefulKeys<string & K>]: T[K];
};

/**
 * StatefulKeyToEventMap is a utility type that maps each key of a given
 * string type to a specific event type. It is used to create a mapping
 * between gesture states and their corresponding event types.
 */
export type StatefulKeyToEventMap<Key extends string, Event> = {
  [K in StatefulKeys<Key>]: Event;
};

/**
 * Used to create an internal event to trigger force reset on the pointer manager.
 */
export type InternalEvent = PointerEvent & {
  forceReset: boolean;
};

/**
 * MergeUnions is a utility type that merges all union types into a single type.
 * It ensures that all properties from the union types are included in the resulting type.
 * This is useful for creating a comprehensive type that captures all possible
 * variations of a given type.
 *
 * @template T - The union type to be merged
 *
 * @example
 * ```typescript
 * type UnionType = { a: number } | { b: string };
 * type MergedType = MergeUnions<UnionType>;
 * // Results in:
 * // {
 * //   a: number;
 * //   b: string;
 * // }
 * ```
 */
export type MergeUnions<T> = { [K in keyof AddMissingProps<T>]: AddMissingProps<T>[K] };
type AllKeys<T> = T extends unknown ? keyof T : never;
type AddMissingProps<T, K extends PropertyKey = AllKeys<T>> = T extends unknown
  ? T & Record<Exclude<K, keyof T>, never>
  : never;
