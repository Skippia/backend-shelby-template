/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { PassportSerializer } from '@nestjs/passport'
import type { PrismaClient, $Enums } from '@prisma/db'
import { Inject } from '@nestjs/common'

import { IAuthSessionRepository } from '@auth-session/domain'
import type { UserEntity } from '@auth-session/domain'

import { InjectLogger, ILoggerService } from '@shared/modules/logger'

import { AuthSessionRepositoryModule } from '../repositories'

/**
 * This class decides which data we are going to save in redis session
 */
export class SessionRedisSerializer extends PassportSerializer {
  constructor(
    @Inject(AuthSessionRepositoryModule.AUTH_SESSION_REPOSITORY_TOKEN)
    readonly authSessionRepository: IAuthSessionRepository<PrismaClient>,
    @InjectLogger(SessionRedisSerializer.name)
    readonly logger: ILoggerService,
  ) {
    super()
  }

  /**
   * What we are going to save in redis
   */
  serializeUser(
    user: UserEntity,
    done: (err: Error, user: { email: string; roles: $Enums.RoleEnum[] }) => void,
  ): void {
    this.logger.trace('Call `SessionRedisSerializer.serializeUser`')
    // @ts-expect-error ...
    done(null, { email: user.email, roles: user.roles })
  }

  /**
   * What we are going to get from redis and add into session.passport
   * each time during invkoing `SessionRedisGuard`
   */
  deserializeUser(
    payload: { email: string; roles: $Enums.RoleEnum[] },
    done: (err: Error, user: Omit<UserEntity, 'password'>) => void,
  ): void {
    this.logger.trace('Call `SessionRedisSerializer.deserializeUser`')

    const user = this.authSessionRepository.findUserByEmail(payload.email)
    // @ts-expect-error ...
    done(null, user)
  }
}
