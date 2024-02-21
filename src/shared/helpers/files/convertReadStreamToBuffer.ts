import type { ReadStream } from 'fs'

export async function convertReadStreamToBufffer(file: ReadStream): Promise<Buffer> {
  const buffers: Uint8Array[] = []

  for await (const data of file) {
    buffers.push(data as Uint8Array)
  }

  const finalBuffer = Buffer.concat(buffers)

  return finalBuffer
}
