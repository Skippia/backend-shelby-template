export function generateBufferKey(prefixBufferKey: string, idx: number): string {
  return `${prefixBufferKey}/${idx}#buffer`
}
