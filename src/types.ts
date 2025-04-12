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
type StatefulKeys<T extends string> = `${T}Start` | T | `${T}End` | `${T}Cancel`;

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

export type InternalEvent = PointerEvent & {
  forceReset: boolean;
};
