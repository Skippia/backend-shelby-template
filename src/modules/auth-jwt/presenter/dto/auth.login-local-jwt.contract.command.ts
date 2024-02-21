import { createZodDto } from '@anatine/zod-nestjs'
import { extendApi } from '@anatine/zod-openapi'
import { z } from 'zod'
/**
 * `${ModuleName}${Usecase}RequestSchema`
 */
const AuthLoginLocalJwtRequestSchema = extendApi(
  z
    .object({
      email: extendApi(z.string().email('Invalid email format'), {
        description: 'Please give me a email',
        example: 'anystring@gmail.com',
      }),
      password: extendApi(z.string().min(6, 'Password should be at least 6 characters'), {
        description: 'Please give me a password',
        example: 'elaboratedPassword123',
      }),
    })
    .strict(),
)

/**
 * `${ModuleName}${Usecase}Contract`
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AuthLoginLocalJwtContract {
  /**
   * `${ModuleName}${Usecase}Request`
   */
  export class AuthLoginLocalJwtRequest extends createZodDto(AuthLoginLocalJwtRequestSchema) {}
}

/**
 * `${ModuleName}${Usecase}Request`
 */
export type AuthLoginLocalJwtRequest = z.infer<typeof AuthLoginLocalJwtRequestSchema>
