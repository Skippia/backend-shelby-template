import { Injectable } from '@nestjs/common'

import type { Prisma, User } from '@prisma/db'

import { UserEntity } from '@auth-session/domain'

@Injectable()
export class AuthMapper {
  /**
   * User
   */
  // How we save model in database
  toPersistenceUser(user: UserEntity): Prisma.UserCreateArgs {
    return {
      data: {
        email: user.email,
        username: user.username,
        provider: user.provider,
        password: user.password,
        roles: user.roles,
        isEmailConfirmed: user.isEmailConfirmed,
        emailConfirmationToken: user.emailConfirmationToken,
      },
    }
  }

  // We extract model from database and turn it into domain model
  toDomainUser(userSchema: User): UserEntity {
    return new UserEntity({
      id: userSchema.id,
      email: userSchema.email,
      username: userSchema.username,
      provider: userSchema.provider,
      roles: userSchema.roles,
      password: userSchema.password,
      isEmailConfirmed: userSchema.isEmailConfirmed,
      emailConfirmationToken: userSchema.emailConfirmationToken,
    })
  }
}
