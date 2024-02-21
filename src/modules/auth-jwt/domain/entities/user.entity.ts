import type { $Enums } from '@prisma/db'

/**
 * Anemic model
 */
export class UserEntity {
  email: string | null
  username: string | null
  provider: $Enums.AuthProviderEnum
  roles: Array<$Enums.RoleEnum>
  password: string | null
  id: number | null
  isEmailConfirmed: boolean
  emailConfirmationToken: string | null

  constructor({
    email,
    username,
    provider,
    roles,
    password,
    id,
    isEmailConfirmed,
    emailConfirmationToken,
  }: {
    email: string | null
    username: string | null
    provider: $Enums.AuthProviderEnum
    roles: Array<$Enums.RoleEnum>
    password: string | null
    id: number | null
    isEmailConfirmed: boolean
    emailConfirmationToken: string | null
  }) {
    this.provider = provider

    this.email = email
    this.username = username
    this.provider = provider
    this.password = password
    this.roles = roles
    this.id = id
    this.isEmailConfirmed = isEmailConfirmed
    this.emailConfirmationToken = emailConfirmationToken
  }
}
