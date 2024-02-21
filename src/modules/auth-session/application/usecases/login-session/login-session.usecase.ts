import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common'

import { compareSync } from 'bcrypt'

import type { PrismaClient } from '@prisma/db'

import type { AuthLoginSessionRequest } from '@auth-session/presenter'

import type { UserEntity } from '@auth-session/domain'
import { IAuthSessionRepository } from '@auth-session/domain'

import { AuthSessionModule } from '@auth-session/infrastructure/adapters/auth-session'

import { IAuthSessionService } from '@auth-session/application/ports'

import { AuthSessionRepositoryModule } from '@auth-session/infrastructure/repositories'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import type { ILoginSessionUsecase } from './login-session.usecase.types'

@Injectable()
export class LoginSessionUsecase implements ILoginSessionUsecase {
  constructor(
    @Inject(AuthSessionRepositoryModule.AUTH_SESSION_REPOSITORY_TOKEN)
    readonly authSessionRepository: IAuthSessionRepository<PrismaClient>,
    @Inject(forwardRef(() => AuthSessionModule.SERVICE_TOKEN))
    readonly authJwtService: IAuthSessionService,
    @InjectLogger(LoginSessionUsecase.name)
    readonly logger: ILoggerService,
  ) {}

  async execute(dto: AuthLoginSessionRequest): Promise<UserEntity> {
    this.logger.log('try login...')

    const { email, password } = dto

    const maybeUser = await this.authSessionRepository.findUserByEmail(email)

    // 1. If user doesn't exist - throw 401
    if (!maybeUser) {
      throw new UnauthorizedException('Access Denied')
    }

    const arePasswordEqual = compareSync(password, maybeUser.password as string)

    // 2. If user's password is not correct - throw 401
    if (!arePasswordEqual) {
      throw new UnauthorizedException('Access Denied')
    }

    // 3. Update user's rt session (create one or update existing one)
    return maybeUser
  }
}
