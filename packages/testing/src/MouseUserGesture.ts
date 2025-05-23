import { move } from './gestures/MoveUserGesture';
import { MoveUserGestureOptions, MoveUserGestureRoot } from './gestures/MoveUserGesture.types';
import { press } from './gestures/PressUserGesture';
import { PressUserGestureOptions, PressUserGestureRoot } from './gestures/PressUserGesture.types';
import { tap } from './gestures/TapUserGesture';
import { TapUserGestureOptions, TapUserGestureRoot } from './gestures/TapUserGesture.types';
import { turnWheel } from './gestures/TurnWheelUserGesture';
import {
  TurnWheelUserGestureOptions,
  TurnWheelUserGestureRoot,
} from './gestures/TurnWheelUserGesture.types';
import { UserGesture, UserGestureOptions } from './UserGesture';

/**
 * Used for providing a custom mouse gesture.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MouseUserGestureRootExtension {}

/**
 * Defines the mouse gestures.
 * It includes a setup method to initialize global options.
 */
export type MouseUserGestureRoot = {
  setup: (options: UserGestureOptions) => MouseUserGestureRoot;
} & TapUserGestureRoot<'mouse'> &
  PressUserGestureRoot<'mouse'> &
  MoveUserGestureRoot &
  TurnWheelUserGestureRoot &
  MouseUserGestureRootExtension;

/**
 * Class implementing mouse gestures for testing.
 * Provides methods for tap, press, move, and wheel gestures with a mouse pointer.
 */
export class MouseUserGesture extends UserGesture implements MouseUserGestureRoot {
  constructor() {
    super('mouse');
  }

  /**
   * Taps on the target element.
   *
   * @param options - Options for the tap gesture.
   * @returns A promise that resolves when the tap gesture is completed.
   */
  async tap(options: TapUserGestureOptions<'mouse'>): Promise<void> {
    return tap(this.pointerManager, options, this.advanceTimers);
  }

  /**
   * Presses on the target element.
   *
   * @param options - Options for the press gesture.
   * @returns A promise that resolves when the press gesture is completed.
   */
  async press(options: PressUserGestureOptions<'mouse'>): Promise<void> {
    return press(this.pointerManager, options, this.advanceTimers);
  }

  /**
   * Moves the mouse pointer.
   *
   * @param options - Options for the move gesture.
   * @returns A promise that resolves when the move gesture is completed.
   */
  async move(options: MoveUserGestureOptions): Promise<void> {
    return move(this.pointerManager, options, this.advanceTimers);
  }

  /**
   * Simulates a mouse wheel event.
   *
   * @param options - Options for the wheel gesture.
   * @returns A promise that resolves when the wheel gesture is completed.
   */
  async turnWheel(options: TurnWheelUserGestureOptions): Promise<void> {
    return turnWheel(this.pointerManager, options, this.advanceTimers);
  }
}

// Export an instance of MouseUserGesture as the default export
export const mouseGesture = new MouseUserGesture();
