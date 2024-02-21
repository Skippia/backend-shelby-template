import type { PrismaClient } from '@prisma/db'

import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'

import type { ILoggerService } from '@shared/modules/logger'

import type { ILogoutJwtUsecase } from './logout-jwt.usecase.types'

export class LogoutJwtUsecase implements ILogoutJwtUsecase {
  constructor(
    readonly authJwtRepository: IAuthJwtRepository<PrismaClient>,
    readonly logger: ILoggerService,
  ) {}

  async execute(maybeRt: string | undefined): Promise<void> {
    this.logger.log('try logout...')

    if (!maybeRt) {
      return
    }

    await this.authJwtRepository.deleteRtSessionByRt(maybeRt)
  }
}
