import { Pointer, Pointers } from '../Pointers';

export type PinchUserGestureOptions = {
  /**
   * The target element to start the pinch on.
   */
  target: Element;
  /**
   * The default duration of the pinch in milliseconds.
   *
   * This can be overridden by the duration property in the chain of gestures.
   *
   * @default 500
   */
  duration?: number;
  /**
   * The amount of steps to be performed.
   *
   * This can be overridden by the steps property in the chain of gestures.
   *
   * @default 10
   */
  steps?: number;
};

export type PinchUserGestureRoot = {
  /**
   * Sets up the pinch gesture with the given options.
   *
   * @returns The pinch gesture builder.
   */
  pinch: (options: PinchUserGestureOptions) => PinchUserGestureBuilder;
};

export type PinchByDistanceOptions = {
  /**
   * The pointers configuration to be used.
   *
   * It can be an object with the amount and distance properties, or an array of pointers.
   *
   * @default
   * { amount: 2, distance: 50 }
   */
  pointers?: Pointers;
  /**
   * The distance to pinch by in pixels.
   *
   * ```ts
   *   0 // No pinch
   *  50 // Pinch out
   * -50 // Pinch in
   * ```
   */
  distance: number;
  /**
   * The duration of the pinch in milliseconds.
   *
   * @default 500
   */
  duration?: number;
  /**
   * The amount of steps to be performed.
   *
   * @default 10
   */
  steps?: number;
  /**
   * The angle of the pinch in degrees.
   *
   * ```ts
   * 0 // Horizontal pinch
   * 90 // Vertical pinch
   * 45 // Diagonal pinch
   * ```
   *
   * @default 0
   */
  angle?: number;
};

export type PinchByPointsOptions = {
  /**
   * The start position of all the pointers.
   */
  start: Pointer[];
  /**
   * The end position of all the pointers.
   */
  end: Pointer[];
  /**
   * The duration of the pinch in milliseconds.
   *
   * @default 500
   */
  duration?: number;
  /**
   * The amount of steps to be performed.
   *
   * @default 10
   */
  steps?: number;
};

export type PinchRunOptions = {
  /**
   * Defines if the pointers should be released after the pinch gesture.
   *
   * If set to true, all pointers will be released.
   * If set to an array of ids, only the pointers with the given ids will be released.
   * If set to false, no pointers will be released.
   *
   * Useful for running expects while the pointers are still pressed.
   * Or to test partially releasing pointers.
   *
   * @default true
   */
  releasePointers?: boolean | number[];
};

export type PinchUserGestureBuilder = {
  /**
   * Uses the distance between the pointers to determine the pinch gesture.
   */
  byDistance: (options: PinchByDistanceOptions) => PinchUserGestureBuilder;
  /**
   * Uses the start and end points of the pointers to determine the pinch gesture.
   */
  byPoints: (options: PinchByPointsOptions) => PinchUserGestureBuilder;
  /**
   * Runs the pinch gesture.
   */
  run: (options?: PinchRunOptions) => Promise<void>;
};
