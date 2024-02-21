/* eslint-disable @typescript-eslint/ban-types */
import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface'
import { ApiBody, ApiConsumes } from '@nestjs/swagger'

import { fileMimetypeFilter } from './file-mimetype-filter'

export function ApiFile(
  fieldName = 'file',
  required = false,
  localOptions?: MulterOptions,
): <TFunction extends Function, Y>(
  target: object | TFunction,
  propertyKey?: string | symbol | undefined,
  descriptor?: TypedPropertyDescriptor<Y> | undefined,
) => void {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName, localOptions)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: required ? [fieldName] : [],
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
  )
}

export function ApiImageFile(
  fileName = 'image',
  required = false,
): <TFunction extends Function, Y>(
  target: object | TFunction,
  propertyKey?: string | symbol | undefined,
  descriptor?: TypedPropertyDescriptor<Y> | undefined,
) => void {
  return ApiFile(fileName, required, {
    fileFilter: fileMimetypeFilter('image'),
  })
}

export function ApiPdfFile(
  fileName = 'document',
  required = false,
): <TFunction extends Function, Y>(
  target: object | TFunction,
  propertyKey?: string | symbol | undefined,
  descriptor?: TypedPropertyDescriptor<Y> | undefined,
) => void {
  return ApiFile(fileName, required, {
    fileFilter: fileMimetypeFilter('pdf'),
  })
}
