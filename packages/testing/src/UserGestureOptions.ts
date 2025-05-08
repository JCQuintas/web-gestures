/**
 * Global user gesture options.
 */
export type UserGestureOptions = {
  /**
   * Custom function to replace setTimeout for advancing timers in tests.
   * Useful for testing with fake timers.
   */
  advanceTimers?: (ms: number) => Promise<void>;

  /**
   * Sets the delay between events in milliseconds.
   *
   * @default 50
   */
  delay?: number;
};
