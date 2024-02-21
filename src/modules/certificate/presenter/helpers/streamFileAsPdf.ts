import { StreamableFile } from '@nestjs/common'

import { Readable } from 'node:stream'

import type { AppResponse } from '@shared/modules/app'

export function streamFileAsPdf(res: AppResponse, files: Buffer): StreamableFile {
  // If we have only 1 certificate - return it as-is
  const streamPdfFile = Readable.from(files)

  res.set({
    'Content-Disposition': 'inline; filename="certificate.pdf"',
    'Content-Type': 'application/pdf',
  })

  return new StreamableFile(streamPdfFile)
}
