/**
 * If input is Array - return as-is
 * Else return [input]
 */
export function windValueToArray<T = unknown>(maybeValue: T | T[]): T[] {
  return Array.isArray(maybeValue) ? maybeValue : [maybeValue]
}
