import { PinchUserGestureRoot } from './gestures/PinchUserGesture';
import { TapUserGestureRoot } from './gestures/TapUserGesture';
import { UserGestureOptions } from './UserGestureOptions';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TouchUserGestureRootExtension {}

/**
 * Defines the touch gestures.
 * It includes a setup method to initialize global options.
 */
export type TouchUserGestureRoot = {
  setup: (options: UserGestureOptions) => TouchUserGestureRoot;
} & TapUserGestureRoot &
  PinchUserGestureRoot &
  TouchUserGestureRootExtension;
