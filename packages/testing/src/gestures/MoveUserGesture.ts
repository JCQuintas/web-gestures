import { Pointer } from '../Pointers';

export type MoveUserGestureOptions = {
  /**
   * The target element to start the move on.
   */
  target: Element;
  /**
   * The default duration of the move in milliseconds.
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

export type MoveUserGestureRoot = {
  /**
   * Sets up the move gesture with the given options.
   *
   * @returns The move gesture builder.
   */
  move: (options: MoveUserGestureOptions) => MoveUserGestureBuilder;
};

export type MoveByDistanceOptions = {
  /**
   * The distance to move by in pixels.
   *
   * ```ts
   *   0 // No move
   *  50 // Move out
   * -50 // Move in
   * ```
   */
  distance: number;
  /**
   * The duration of the move in milliseconds.
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

export type MoveByPointsOptions = {
  /**
   * The start position of all the pointers.
   * If not provided, it will start from the current position if available, otherwise from the center of the target element.
   */
  start?: Pointer;
  /**
   * The end position of all the pointers.
   */
  end: Pointer;
  /**
   * The duration of the move in milliseconds.
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

// export type MoveRunOptions = never;

export type MoveUserGestureBuilder = {
  /**
   * Uses the distance between the pointers to determine the move gesture.
   */
  byDistance: (options: MoveByDistanceOptions) => MoveUserGestureBuilder;
  /**
   * Uses the start and end points of the pointers to determine the move gesture.
   */
  byPoints: (options: MoveByPointsOptions) => MoveUserGestureBuilder;
  /**
   * Runs the move gesture.
   */
  run: () // options?: MoveRunOptions
  => Promise<void>;
};
