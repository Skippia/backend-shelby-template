import type { PrismaClient } from '@prisma/db'

import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'
import type { AuthSignupLocalConfirmRequest } from '@auth-jwt/presenter/dto'

import type { ILoggerService } from '@shared/modules/logger'

export type ISignupLocalConfirmUsecase = {
  authJwtRepository: IAuthJwtRepository<PrismaClient>
  logger: ILoggerService
  execute(dto: AuthSignupLocalConfirmRequest): Promise<void>
}
