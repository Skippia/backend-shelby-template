import { UnsupportedMediaTypeException } from '@nestjs/common'
import type { Request } from 'express'

export function fileMimetypeFilter(...mimetypes: string[]) {
  return (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (mimetypes.some((m) => file.mimetype.includes(m))) {
      callback(null, true)
    } else {
      callback(
        new UnsupportedMediaTypeException(`File type is not matching: ${mimetypes.join(', ')}`),
        false,
      )
    }
  }
}
