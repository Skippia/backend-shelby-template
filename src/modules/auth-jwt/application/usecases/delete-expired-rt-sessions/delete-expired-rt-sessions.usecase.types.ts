import type { PrismaClient } from '@prisma/db'

import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'

import type { ILoggerService } from '@shared/modules/logger'

export type IDeleteExpiredRtSessionsUsecase = {
  readonly authJwtRepository: IAuthJwtRepository<PrismaClient>
  readonly logger: ILoggerService
  execute(): Promise<void>
}
