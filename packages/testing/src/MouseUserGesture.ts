import { MoveUserGestureRoot } from './gestures/MoveUserGesture';
import { PressUserGestureRoot } from './gestures/PressUserGesture';
import { TapUserGestureRoot } from './gestures/TapUserGesture';
import { TurnWheelUserGestureRoot } from './gestures/TurnWheelUserGesture';
import { UserGestureOptions } from './UserGestureOptions';

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
