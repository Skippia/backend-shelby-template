/* eslint-disable @typescript-eslint/ban-types */
import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import type {
  MulterField,
  MulterOptions,
} from '@nestjs/platform-express/multer/interfaces/multer-options.interface'
import { ApiBody, ApiConsumes } from '@nestjs/swagger'
import type {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'

export type UploadFields = MulterField & { required?: boolean }

export function ApiFileFields(
  uploadFields: UploadFields[],
  localOptions?: MulterOptions,
): <TFunction extends Function, Y>(
  target: object | TFunction,
  propertyKey?: string | symbol | undefined,
  descriptor?: TypedPropertyDescriptor<Y> | undefined,
) => void {
  const bodyProperties: Record<string, SchemaObject | ReferenceObject> = Object.assign(
    {},
    ...uploadFields.map((field) => ({ [field.name]: { type: 'string', format: 'binary' } })),
  )
  const apiBody = ApiBody({
    schema: {
      type: 'object',
      properties: bodyProperties,
      required: uploadFields.filter((f) => f.required).map((f) => f.name),
    },
  })

  return applyDecorators(
    UseInterceptors(FileFieldsInterceptor(uploadFields, localOptions)),
    ApiConsumes('multipart/form-data'),
    apiBody,
  )
}
