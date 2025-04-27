/**
 * Common types used throughout the testing package.
 */

/**
 * Represents a point on the screen.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Options common to all gesture simulators.
 */
export interface BaseSimulatorOptions {
  /**
   * The element to perform the gesture on.
   */
  element: HTMLElement | SVGElement;

  /**
   * The pointer type to use for the gesture.
   * @default 'mouse'
   */
  pointerType?: 'mouse' | 'touch' | 'pen';

  /**
   * Whether to skip dispatching a pointerdown event.
   * Useful when chaining gestures.
   * @default false
   */
  skipPointerDown?: boolean;

  /**
   * Whether to skip dispatching a pointerup event.
   * Useful when chaining gestures.
   * @default false
   */
  skipPointerUp?: boolean;

  /**
   * Custom function to replace setTimeout for advancing timers in tests.
   * Useful for testing with fake timers.
   * @param ms Number of milliseconds to advance the timer
   * @returns Promise that resolves when the timer has advanced
   */
  advanceTimers?: (ms: number) => Promise<void>;
}

/**
 * Options for a pan gesture simulation.
 */
export interface PanSimulatorOptions extends BaseSimulatorOptions {
  /**
   * Starting point of the pan gesture.
   */
  start: Point;

  /**
   * End point of the pan gesture.
   */
  end: Point;

  /**
   * Duration of the pan gesture in milliseconds.
   * @default 300
   */
  duration?: number;

  /**
   * Number of intermediate points to generate.
   * @default 10
   */
  steps?: number;
}

/**
 * Options for a pinch gesture simulation.
 */
export interface PinchSimulatorOptions extends BaseSimulatorOptions {
  /**
   * Center point of the pinch gesture.
   */
  center: Point;

  /**
   * Initial distance between the two pointers.
   */
  startDistance: number;

  /**
   * Final distance between the two pointers.
   */
  endDistance: number;

  /**
   * Duration of the pinch gesture in milliseconds.
   * @default 300
   */
  duration?: number;

  /**
   * Number of intermediate points to generate.
   * @default 10
   */
  steps?: number;
}

/**
 * Options for a rotate gesture simulation.
 */
export interface RotateSimulatorOptions extends BaseSimulatorOptions {
  /**
   * Center point of the rotation.
   */
  center: Point;

  /**
   * Radius of the rotation in pixels.
   * @default 50
   */
  radius?: number;

  /**
   * Starting angle in degrees.
   * @default 0
   */
  startAngle?: number;

  /**
   * Ending angle in degrees.
   * @default 90
   */
  endAngle?: number;

  /**
   * Duration of the rotation in milliseconds.
   * @default 300
   */
  duration?: number;

  /**
   * Number of intermediate points to generate.
   * @default 10
   */
  steps?: number;
}

/**
 * Options for a press gesture simulation.
 */
export interface PressSimulatorOptions extends BaseSimulatorOptions {
  /**
   * Position of the press.
   */
  position: Point;

  /**
   * Duration of the press in milliseconds.
   * @default 500
   */
  duration?: number;
}

/**
 * Options for a tap gesture simulation.
 */
export interface TapSimulatorOptions extends BaseSimulatorOptions {
  /**
   * Position of the tap.
   */
  position: Point;

  /**
   * Number of taps to perform.
   * @default 1
   */
  taps?: number;

  /**
   * Delay between taps in milliseconds.
   * @default 100
   */
  delay?: number;
}

/**
 * Options for a move gesture simulation.
 */
export interface MoveSimulatorOptions extends BaseSimulatorOptions {
  /**
   * Starting point of the move.
   */
  start: Point;

  /**
   * End point of the move.
   */
  end: Point;

  /**
   * Duration of the move in milliseconds.
   * @default 300
   */
  duration?: number;

  /**
   * Number of intermediate points to generate.
   * @default 10
   */
  steps?: number;
}

/**
 * Options for a wheel/scroll gesture simulation.
 */
export interface TurnWheelSimulatorOptions extends BaseSimulatorOptions {
  /**
   * Position where the wheel event should occur.
   */
  position: Point;

  /**
   * Delta X value for horizontal scrolling.
   * @default 0
   */
  deltaX?: number;

  /**
   * Delta Y value for vertical scrolling.
   * @default 100
   */
  deltaY?: number;

  /**
   * Delta Z value for 3D scrolling.
   * @default 0
   */
  deltaZ?: number;

  /**
   * Number of wheel events to dispatch.
   * @default 1
   */
  steps?: number;

  /**
   * Delay between wheel events in milliseconds.
   * @default 50
   */
  stepDelay?: number;
}
