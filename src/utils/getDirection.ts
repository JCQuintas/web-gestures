/**
 * Get the direction of movement based on the current and previous positions
 */
export function getDirection(
  previous: { x: number; y: number },
  current: { x: number; y: number }
): 'up' | 'down' | 'left' | 'right' | null {
  const deltaX = current.x - previous.x;
  const deltaY = current.y - previous.y;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left';
  } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
    return deltaY > 0 ? 'down' : 'up';
  }

  return null;
}
