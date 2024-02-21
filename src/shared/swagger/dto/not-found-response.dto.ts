import { extendApi } from '@anatine/zod-openapi'
import { z } from 'zod'
import { createZodDto } from '@anatine/zod-nestjs'

import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'

const _GP = APP_DEFAULT_OPTIONS.globalPrefix

/**
 * `${ModuleName}${Usecase}ResponseSchema`
 */
const NotFoundResponseSchema = z.object({
  message: extendApi(z.string(), {
    description: 'Error message',
    example: 'User not found',
  }),
  statusCode: extendApi(z.literal(404), {
    description: 'Error status code',
    example: 404,
  }),
  errorName: extendApi(z.literal('NotFoundException'), {
    description: 'Error name',
    example: 'NotFoundException',
  }),
  timestamp: extendApi(z.string().datetime(), {
    description: 'ISO 8601 datetime of request',
    example: '2024-01-01T00:00:00Z',
  }),
  path: extendApi(z.string(), {
    description: 'Path to endpoint on the server',
    example: `${_GP}/certificate/generate`,
  }),
})

/**
 * `${ModuleName}${Usecase}Contract`
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace NotFoundContract {
  /**
   * `${ModuleName}${Usecase}Request`
   * `${ModuleName}${Usecase}Response`
   */
  export class NotFoundResponse extends createZodDto(NotFoundResponseSchema) {}
}
