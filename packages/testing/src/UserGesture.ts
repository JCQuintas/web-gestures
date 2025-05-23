import { PointerManager } from './PointerManager';
import { PointerType } from './Pointers';

/**
 * Global user gesture options.
 */
export type UserGestureOptions = {
  /**
   * Custom function to replace setTimeout for advancing timers in tests.
   * Useful for testing with fake timers.
   */
  advanceTimers?: (ms: number) => Promise<void>;
};

export class UserGesture {
  protected pointerManager: PointerManager;
  protected advanceTimers?: (ms: number) => Promise<void>;

  /**
   * Creates a new MouseUserGesture instance.
   */
  constructor(pointerType: PointerType) {
    this.pointerManager = new PointerManager(pointerType);
  }

  /**
   * Configures global options for the gestures.
   *
   * @param options - Global options for the gestures.
   * @returns This instance.
   */
  setup(options: UserGestureOptions): this {
    this.advanceTimers = options.advanceTimers;
    return this;
  }
}
