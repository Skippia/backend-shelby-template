import type { Stream } from 'node:stream'

export async function streamToBuffer(stream: Stream): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const _buf: Uint8Array[] = []

    stream.on('data', (chunk: Uint8Array) => _buf.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(_buf)))
    // eslint-disable-next-line prefer-promise-reject-errors
    stream.on('error', (err) => reject(`error converting stream - ${err}`))
  })
}
