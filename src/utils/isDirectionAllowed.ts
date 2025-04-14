/**
 * Check if a direction matches one of the allowed directions
 */
export function isDirectionAllowed(
  direction: 'up' | 'down' | 'left' | 'right' | null,
  allowedDirections: Array<'up' | 'down' | 'left' | 'right'>
): boolean {
  if (direction === null) return false;
  if (allowedDirections.length === 0) return true;
  return allowedDirections.includes(direction);
}
