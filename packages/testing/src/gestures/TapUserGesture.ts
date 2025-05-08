import { Pointers } from '../Pointers';

export type TapUserGestureOptions = {
  /**
   * The target element to tap on.
   */
  target: Element;
  /**
   * The pointers configuration to be used.
   *
   * It can be an object with the amount and distance properties, or an array of pointers.
   *
   * @default
   * { amount: 1, distance: 50 }
   */
  pointers?: Pointers;
  /**
   * The amount of taps to be performed.
   *
   * @default 1
   */
  taps?: number;
  /**
   * The delay between taps in milliseconds.
   *
   * @default 50
   */
  delay?: number;
};

export type TapUserGestureRoot = {
  /**
   * Taps on the target element.
   *
   * @returns A promise that resolves when the tap gesture is completed.
   */
  tap: (options: TapUserGestureOptions) => Promise<void>;
};
