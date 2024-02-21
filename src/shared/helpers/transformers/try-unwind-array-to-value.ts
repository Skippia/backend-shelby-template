/**
 * Return value only if array contains 1 element
 * Else return the same array
 */
export function tryUnwindArrayToValue<T = unknown[]>(arr: T[]): T | T[] {
  return arr.length === 1 ? arr[0] : arr
}
