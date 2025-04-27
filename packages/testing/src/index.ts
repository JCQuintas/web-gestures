/**
 * Entry point for @web-gestures/testing
 *
 * A utility package for simulating user gestures in testing environments
 * to validate gesture handlers and callbacks.
 */

import { GestureSimulatorOptions } from './GestureSimulator';
import { MoveSimulator } from './simulators/MoveSimulator';
import { PanSimulator } from './simulators/PanSimulator';
import { PinchSimulator } from './simulators/PinchSimulator';
import { PressSimulator } from './simulators/PressSimulator';
import { RotateSimulator } from './simulators/RotateSimulator';
import { TapSimulator } from './simulators/TapSimulator';
import { TurnWheelSimulator } from './simulators/TurnWheelSimulator';
import {
  MoveSimulatorOptions,
  PanSimulatorOptions,
  PinchSimulatorOptions,
  PressSimulatorOptions,
  RotateSimulatorOptions,
  TapSimulatorOptions,
  TurnWheelSimulatorOptions,
} from './types';

// Global configuration that applies to all gesture simulations
let globalConfig: Partial<GestureSimulatorOptions> = {};

/**
 * User gesture simulator API
 * Single entry point for simulating all gesture types
 */
export const userGesture = {
  /**
   * Configure global options for all gesture simulators
   */
  setup(options: Partial<GestureSimulatorOptions>): void {
    globalConfig = { ...globalConfig, ...options };
  },

  /**
   * Simulate a pan (drag) gesture
   */
  async pan(options: PanSimulatorOptions): Promise<void> {
    const simulator = new PanSimulator({ ...globalConfig, ...options });
    return simulator.simulatePan();
  },

  /**
   * Simulate a pinch (zoom) gesture
   */
  async pinch(options: PinchSimulatorOptions): Promise<void> {
    const simulator = new PinchSimulator({ ...globalConfig, ...options });
    return simulator.simulatePinch();
  },

  /**
   * Simulate a rotate gesture
   */
  async rotate(options: RotateSimulatorOptions): Promise<void> {
    const simulator = new RotateSimulator({ ...globalConfig, ...options });
    return simulator.simulateRotate();
  },

  /**
   * Simulate a press (long-press) gesture
   */
  async press(options: PressSimulatorOptions): Promise<void> {
    const simulator = new PressSimulator({ ...globalConfig, ...options });
    return simulator.simulatePress();
  },

  /**
   * Simulate a tap gesture
   */
  async tap(options: TapSimulatorOptions): Promise<void> {
    const simulator = new TapSimulator({ ...globalConfig, ...options });
    return simulator.simulateTap();
  },

  /**
   * Simulate a move (hover) gesture
   */
  async move(options: MoveSimulatorOptions): Promise<void> {
    const simulator = new MoveSimulator({ ...globalConfig, ...options });
    return simulator.simulateMove();
  },

  /**
   * Simulate a wheel (scroll) gesture
   */
  async turnWheel(options: TurnWheelSimulatorOptions): Promise<void> {
    const simulator = new TurnWheelSimulator({ ...globalConfig, ...options });
    return simulator.simulateTurnWheel();
  },
};

// Export types for TypeScript users
export * from './types';

// Export simulator classes for advanced usage
export { GestureSimulator } from './GestureSimulator';
export { PointerGestureSimulator } from './PointerGestureSimulator';
export { MoveSimulator } from './simulators/MoveSimulator';
export { PanSimulator } from './simulators/PanSimulator';
export { PinchSimulator } from './simulators/PinchSimulator';
export { PressSimulator } from './simulators/PressSimulator';
export { RotateSimulator } from './simulators/RotateSimulator';
export { TapSimulator } from './simulators/TapSimulator';
export { TurnWheelSimulator } from './simulators/TurnWheelSimulator';
