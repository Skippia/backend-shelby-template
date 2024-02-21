import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'

import { compareSync } from 'bcrypt'

import type { PrismaClient } from '@prisma/db'

import { IAuthJwtService } from '@auth-jwt/application/ports'
import type { JwtTokens } from '@auth-jwt/domain/helpers/types'
import { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'
import type { AuthLoginLocalJwtRequest } from '@auth-jwt/presenter/dto'

import { AuthJwtRepositoryModule } from '@auth-jwt/infrastructure/repositories'

import { AuthJwtModule } from '@auth-jwt/infrastructure/adapters'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import type { ILoginLocalJwtUsecase } from './login-local-jwt.usecase.types'

@Injectable()
export class LoginLocalJwtUsecase implements ILoginLocalJwtUsecase {
  constructor(
    @Inject(AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN)
    readonly authJwtRepository: IAuthJwtRepository<PrismaClient>,
    @Inject(AuthJwtModule.SERVICE_TOKEN)
    readonly authJwtService: IAuthJwtService,
    @InjectLogger(LoginLocalJwtUsecase.name)
    readonly logger: ILoggerService,
  ) {}

  async execute(dto: AuthLoginLocalJwtRequest, oldRt: string | undefined): Promise<JwtTokens> {
    this.logger.log('try login...')

    const { email, password } = dto

    const maybeUser = await this.authJwtRepository.findUserByEmail(email)

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
    const tokens = await this.authJwtService.refreshTokens(
      {
        userId: maybeUser.id as number,
        email: maybeUser.email,
        roles: maybeUser.roles,
        username: maybeUser.username,
      },
      oldRt,
    )

    return tokens
  }
}
