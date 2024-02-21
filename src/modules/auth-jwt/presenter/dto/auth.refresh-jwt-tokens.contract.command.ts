import { createZodDto } from '@anatine/zod-nestjs'

import { z } from 'zod'
import { extendApi } from '@anatine/zod-openapi'

import { $Enums } from '@prisma/db'

/**
 * `${ModuleName}${Usecase}RequestSchema`
 * `${ModuleName}${Usecase}ResponseSchema`
 */
const AuthRefreshJwtRequestSchema = z
  .object({
    email: extendApi(z.string().email('Invalid email format').nullable(), {
      description: "User's email (will be extract from RT)",
      example: 'anystring@gmail.com',
    }),
    roles: extendApi(
      z.array(z.nativeEnum($Enums.RoleEnum)).min(1, 'At least one role is required'),
      {
        description: "User's role (will be extract from RT)",
        example: "['USER']",
      },
    ),
    sub: extendApi(z.number(), {
      description: "User's id (will be extract from RT)",
      example: 1,
    }),
    username: extendApi(z.string().min(1, 'Username cannot be empty').nullable(), {
      description: "User's username (will be extract from RT)",
      example: 'anyusername',
    }),
  })
  .strip()

/**
 * `${ModuleName}${Usecase}Contract`
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AuthRefreshJwtTokensContract {
  /**
   * `${ModuleName}${Usecase}Request`
   * `${ModuleName}${Usecase}Response`
   */
  export class AuthRefreshJwtRequest extends createZodDto(AuthRefreshJwtRequestSchema) {}
}

/**
 * `${ModuleName}${Usecase}Request`
 * `${ModuleName}${Usecase}Response`
 */
export type AuthRefreshJwtTokensRequest = z.infer<typeof AuthRefreshJwtRequestSchema>
