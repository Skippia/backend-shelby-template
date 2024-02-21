import { extendApi } from '@anatine/zod-openapi'
import { createZodDto } from '@anatine/zod-nestjs'
import { z } from 'zod'

/**
 * `${ModuleName}${Usecase}RequestSchema`
 */
const AuthSignupLocalConfirmRequestSchema = z.object({
  token: extendApi(z.string().min(1, 'Token cannot be empty'), {
    description: 'Token sent to your email address',
    example: '1234',
  }),
})

/**
 * `${ModuleName}${Usecase}Contract`
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AuthSignupLocalConfirmContract {
  /**
   * `${ModuleName}${Usecase}Request`
   */
  export class AuthSignupLocalConfirmRequest extends createZodDto(
    AuthSignupLocalConfirmRequestSchema,
  ) {}
}

/**
 * `${ModuleName}${Usecase}Request`
 */
export type AuthSignupLocalConfirmRequest = z.infer<typeof AuthSignupLocalConfirmRequestSchema>
