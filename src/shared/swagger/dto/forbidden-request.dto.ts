import { extendApi } from '@anatine/zod-openapi'
import { z } from 'zod'
import { createZodDto } from '@anatine/zod-nestjs'

import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'

const _GP = APP_DEFAULT_OPTIONS.globalPrefix

/**
 * `${ModuleName}${Usecase}ResponseSchema`
 */
const ForbiddenRequestSchema = z.object({
  message: extendApi(z.literal('Forbidden resource'), {
    description: 'Error message',
    example: 'Forbidden resource',
  }),
  statusCode: extendApi(z.literal(401), {
    description: 'Error status code',
    example: 403,
  }),
  errorName: extendApi(z.literal('ForbiddenException'), {
    description: 'Error name',
    example: 'ForbiddenException',
  }),
  timestamp: extendApi(z.string().datetime(), {
    description: 'ISO 8601 datetime of request',
    example: '2024-01-01T00:00:00Z',
  }),
  path: extendApi(z.string(), {
    description: 'Path to endpoint on the server',
    example: `${_GP}/auth/jwt/logout`,
  }),
})

/**
 * `${ModuleName}${Usecase}Contract`
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ForbiddenContract {
  /**
   * `${ModuleName}${Usecase}Request`
   * `${ModuleName}${Usecase}Response`
   */
  export class ForbiddenRequest extends createZodDto(ForbiddenRequestSchema) {}
}
