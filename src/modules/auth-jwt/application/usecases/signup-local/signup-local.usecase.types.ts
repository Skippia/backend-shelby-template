import type { PrismaClient } from '@prisma/db'

import type { UserEntity } from '@auth-jwt/domain/entities'
import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'
import type { AuthSignupLocalRequest } from '@auth-jwt/presenter/dto'

import type { ILoggerService } from '@shared/modules/logger'

export type ISignupLocalUsecase = {
  authJwtRepository: IAuthJwtRepository<PrismaClient>
  logger: ILoggerService
  execute(dto: AuthSignupLocalRequest): Promise<UserEntity>
}
