import { StreamableFile } from '@nestjs/common'
import { Readable } from 'node:stream'

import { archiveFiles } from '@shared/helpers/files'
import type { AppResponse } from '@shared/modules/app'

export async function streamFileAsZip(res: AppResponse, files: Buffer[]): Promise<StreamableFile> {
  const streamFiles = files.map((file, idx) => ({
    file: Readable.from(file),
    filename: `certificate-${idx}.pdf`,
  }))

  const { zipBuffer, filename } = await archiveFiles(streamFiles)

  // Save path to file which want to remove after response

  res.set({
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Type': 'application/zip',
  })

  return new StreamableFile(zipBuffer)
}
