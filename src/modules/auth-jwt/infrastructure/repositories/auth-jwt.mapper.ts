import { Injectable } from '@nestjs/common'

import type { Prisma, User, RTSession } from '@prisma/db'

import { RTSessionEntity, UserEntity } from '@auth-jwt/domain/entities'

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

  /**
   * RtSession
   */
  // How we save model in database
  toPersistenceRtSession(rtSession: RTSessionEntity): Prisma.RTSessionCreateArgs {
    return {
      data: {
        rt: rtSession.rt,
        rtExpDate: rtSession.rtExpDate,
        userAgent: rtSession.userAgent,
        userId: rtSession.userId,
      },
    }
  }

  // We extract model from database and turn it into domain model
  toDomainRtSession(rtSessionSchema: RTSession): RTSessionEntity {
    return new RTSessionEntity({
      id: rtSessionSchema.id,
      rt: rtSessionSchema.rt,
      rtExpDate: rtSessionSchema.rtExpDate,
      userAgent: rtSessionSchema.userAgent,
      updatedAt: rtSessionSchema.updatedAt,
      createdAt: rtSessionSchema.createdAt,
      userId: rtSessionSchema.userId,
    })
  }
}
