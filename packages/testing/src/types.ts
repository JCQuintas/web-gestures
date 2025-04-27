import { GestureSimulatorOptions } from './GestureSimulator';

/**
 * Represents a point on the screen.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Options for a pan gesture simulation.
 */
export interface PanSimulatorOptions extends GestureSimulatorOptions {
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
export interface PinchSimulatorOptions extends GestureSimulatorOptions {
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
export interface RotateSimulatorOptions extends GestureSimulatorOptions {
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
export interface PressSimulatorOptions extends GestureSimulatorOptions {
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
 * Options for a move gesture simulation.
 */
export interface MoveSimulatorOptions extends GestureSimulatorOptions {
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
