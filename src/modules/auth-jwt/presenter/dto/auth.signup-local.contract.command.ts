import { createZodDto } from '@anatine/zod-nestjs'
import { extendApi } from '@anatine/zod-openapi'

import { z } from 'zod'

import { $Enums } from '@prisma/db'

/**
 * `${ModuleName}${Usecase}RequestSchema`
 * `${ModuleName}${Usecase}ResponseSchema`
 */
const AuthSignupLocalRequestSchema = z.object({
  email: extendApi(z.string().email('Invalid email format'), {
    description: "User's email",
    example: 'anystring@gmail.com',
  }),
  username: extendApi(z.string().min(1, 'Username cannot be empty'), {
    description: "User's email",
    example: 'anystring@gmail.com',
  }),
  password: extendApi(z.string().min(1, 'Password cannot be empty'), {
    description: "User's password",
    example: 'qwerty123',
  }),
})

export const AuthSignupLocalResponseSchema = z
  .object({
    id: extendApi(z.number(), {
      description: "User's id",
      example: 1,
    }),
    email: extendApi(z.string().email('Invalid email format').nullable(), {
      description: "User's email",
      example: 'anystring@gmail.com',
    }),
    username: extendApi(z.string().min(1, 'Username cannot be empty').nullable(), {
      description: "User's username",
      example: 'anyusername',
    }),
    provider: extendApi(z.nativeEnum($Enums.AuthProviderEnum), {
      description: "User's provider",
      example: 'LOCAL',
    }),
    roles: extendApi(
      z.array(z.nativeEnum($Enums.RoleEnum)).min(1, 'At least one role is required'),
      {
        description: "User's role",
        example: "['USER']",
      },
    ),
    password: z.string().min(1, 'Password cannot be empty').nullable(),
    isEmailConfirmed: extendApi(z.boolean(), {
      description: "User's email confirmation status",
      example: false,
    }),
    emailConfirmationToken: extendApi(
      z.string().min(1, 'Email confirmation token cannot be empty').nullable(),
      {
        description: "User's email confirmation token",
        example: '1234',
      },
    ),
  })
  .omit({
    password: true,
    isEmailConfirmed: true,
    emailConfirmationToken: true,
  })
  .strip()

/**
 * `${ModuleName}${Usecase}Contract`
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AuthSignupLocalContract {
  /**
   * `${ModuleName}${Usecase}Request`
   * `${ModuleName}${Usecase}Response`
   */
  export class AuthSignupLocalRequest extends createZodDto(AuthSignupLocalRequestSchema) {}
  export class AuthSignupLocalResponse extends createZodDto(AuthSignupLocalResponseSchema) {}
}

/**
 * `${ModuleName}${Usecase}Request`
 * `${ModuleName}${Usecase}Response`
 */
export type AuthSignupLocalRequest = z.infer<typeof AuthSignupLocalRequestSchema>
export type AuthSignupLocalResponse = z.infer<typeof AuthSignupLocalResponseSchema>
