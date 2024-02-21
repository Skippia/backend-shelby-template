export function unwindArrayToValue<T = unknown>(maybeArray: Array<T> | T): T {
  return Array.isArray(maybeArray) ? maybeArray[0] : maybeArray
}
