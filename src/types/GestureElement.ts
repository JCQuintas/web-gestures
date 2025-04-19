/**
 * Enhanced HTML element type with strongly-typed gesture event handlers.
 *
 * This type extends the standard Element with correctly typed addEventListener
 * and removeEventListener methods that understand both standard DOM events and
 * custom gesture events.
 *
 * @template T - The base HTML element type
 * @template GestureEventName - The name of the gesture event
 * @template GestureNameToEvent - A mapping of gesture names to their corresponding event types
 *
 * @example
 * ```typescript
 * // Using with default gesture events
 * const div = gestureManager.registerElement('pan', document.querySelector('div'));
 * div.addEventListener('panStart', (e) => {
 *   // TypeScript knows e is a PanEvent with the correct properties
 *   console.log(`Pan started at x: ${e.deltaX}, y: ${e.deltaY}`);
 * });
 *
 * // Using with custom gesture events
 * interface MyEvents {
 *   customGesture: { x: number, y: number }
 * }
 * const manager = new GestureManager<MyEvents>({ root: document.body });
 * const el = manager.registerElement('customGesture', myElement);
 * el.addEventListener('customGesture', (e) => {
 *   // TypeScript knows e has x and y properties
 *   console.log(`Custom gesture at ${e.x}, ${e.y}`);
 * });
 * ```
 */

import { TargetElement } from './TargetElement';

export type GestureElement<
  GestureEventName extends string = string,
  GestureNameToEvent = unknown,
  T = unknown,
> = Omit<T, 'addEventListener' | 'removeEventListener'> & {
  addEventListener<
    K extends GestureEventName,
    GestureEvent = GestureNameToEvent extends Record<GestureEventName, Event>
      ? GestureNameToEvent[K]
      : never,
  >(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: TargetElement, ev: GestureEvent) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: TargetElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<
    K extends GestureEventName,
    GestureEvent = GestureNameToEvent extends Record<GestureEventName, Event>
      ? GestureNameToEvent[K]
      : never,
  >(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: TargetElement, ev: GestureEvent) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: TargetElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
};
