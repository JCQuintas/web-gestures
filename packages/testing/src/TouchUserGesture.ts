import { PanUserGestureRoot } from './gestures/PanUserGesture';
import { PinchUserGestureRoot } from './gestures/PinchUserGesture';
import { PressUserGestureRoot } from './gestures/PressUserGesture';
import { RotateUserGestureRoot } from './gestures/RotateUserGesture';
import { TapUserGestureRoot } from './gestures/TapUserGesture';
import { UserGestureOptions } from './UserGestureOptions';

/**
 * Used for providing a custom touch gesture.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TouchUserGestureRootExtension {}

/**
 * Defines the touch gestures.
 * It includes a setup method to initialize global options.
 */
export type TouchUserGestureRoot = {
  setup: (options: UserGestureOptions) => TouchUserGestureRoot;
} & TapUserGestureRoot<'touch'> &
  PressUserGestureRoot<'touch'> &
  PinchUserGestureRoot &
  PanUserGestureRoot &
  RotateUserGestureRoot &
  TouchUserGestureRootExtension;
