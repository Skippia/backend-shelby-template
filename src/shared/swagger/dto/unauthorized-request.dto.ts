import { extendApi } from '@anatine/zod-openapi'
import { z } from 'zod'
import { createZodDto } from '@anatine/zod-nestjs'

import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'

const _GP = APP_DEFAULT_OPTIONS.globalPrefix

/**
 * `${ModuleName}${Usecase}ResponseSchema`
 */
const UnauthorizedRequestSchema = z.object({
  message: extendApi(z.string(), {
    description: 'Error message',
    example: 'Unauthorized',
  }),
  statusCode: extendApi(z.literal(401), {
    description: 'Error status code',
    example: 401,
  }),
  errorName: extendApi(z.literal('UnauthorizedException'), {
    description: 'Error name',
    example: 'UnauthorizedException',
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
export namespace UnauthorizedContract {
  /**
   * `${ModuleName}${Usecase}Request`
   * `${ModuleName}${Usecase}Response`
   */
  export class UnauthorizedRequest extends createZodDto(UnauthorizedRequestSchema) {}
}
