import { Inject } from '@nestjs/common'

import type { PrismaClient } from '@prisma/db'

import { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'

import { AuthJwtRepositoryModule } from '@auth-jwt/infrastructure/repositories'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import type { IDeleteExpiredRtSessionsUsecase } from './delete-expired-rt-sessions.usecase.types'

export class DeleteExpiredRtSessionsUsecase implements IDeleteExpiredRtSessionsUsecase {
  constructor(
    @Inject(AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN)
    readonly authJwtRepository: IAuthJwtRepository<PrismaClient>,
    @InjectLogger(DeleteExpiredRtSessionsUsecase.name)
    readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<void> {
    const amountDeletedRtExpiredSessions = await this.authJwtRepository.deleteExpiredRtSessions()

    this.logger.log(`delete expired RT sessions: ${amountDeletedRtExpiredSessions}...`)
  }
}
