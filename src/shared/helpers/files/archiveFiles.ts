/* eslint-disable no-console */
import archiver from 'archiver'
import { Writable } from 'stream'
import type { Readable } from 'stream'

export type TFileStreamInfo = {
  file: Readable
  filename: string
}

export async function archiveFiles(
  filesInfo: TFileStreamInfo[],
): Promise<{ zipBuffer: Buffer; filename: string }> {
  // 1. Create stream
  const chunks: Buffer[] = []
  const outputWriteStream: Writable = new Writable({
    write(chunk: Buffer, encoding, callback): void {
      chunks.push(chunk)
      callback()
    },
  })

  // Create unique timestamp to avoid collision during high load (and filename based on it)
  const timestamp = Number(Date.now())
  const archiveFilename = `certificates-${timestamp}.zip`

  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  })

  // listen for all archive data to be written
  // 'close' event is fired only when a file descriptor is involved
  outputWriteStream.on('close', () => {
    // console.log(archive.pointer() + ' total bytes')
    // console.log('archiver has been finalized and the output file descriptor has closed.')
  })

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  outputWriteStream.on('end', () => {
    // console.log('Data has been drained')
  })

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('warning archive error', err)
    } else {
      throw err
    }
  })

  // good practice to catch this error explicitly
  archive.on('error', (err) => {
    throw err
  })

  // pipe archive data to the in-memory stream
  archive.pipe(outputWriteStream)

  filesInfo.forEach(({ file, filename }) => {
    archive.append(file, { name: filename })
  })

  // finalize the archive (ie we are done appending files but streams have to finish yet)
  // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
  await archive.finalize()

  const zipBuffer = Buffer.concat(chunks)
  return { zipBuffer, filename: archiveFilename }
}
