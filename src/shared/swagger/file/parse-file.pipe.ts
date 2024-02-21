import type { ArgumentMetadata, PipeTransform } from '@nestjs/common'
import { Injectable, BadRequestException } from '@nestjs/common'

@Injectable()
export class ParseFile implements PipeTransform {
  transform(
    files: Express.Multer.File | Express.Multer.File[] | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: ArgumentMetadata,
  ): Express.Multer.File | Express.Multer.File[] {
    if (!files) {
      throw new BadRequestException('Validation failed (file expected)')
    }

    if (Array.isArray(files) && files.length === 0) {
      throw new BadRequestException('Validation failed (files expected)')
    }

    return files
  }
}
