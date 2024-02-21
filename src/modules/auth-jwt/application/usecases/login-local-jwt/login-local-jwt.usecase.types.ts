import type { PrismaClient } from '@prisma/db'

import type { IAuthJwtService } from '@auth-jwt/application/ports'
import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'
import type { AuthLoginLocalJwtRequest } from '@auth-jwt/presenter/dto'
import type { JwtTokens } from '@auth-jwt/domain/helpers/types'

import type { ILoggerService } from '@shared/modules/logger'

export type ILoginLocalJwtUsecase = {
  readonly authJwtRepository: IAuthJwtRepository<PrismaClient>
  readonly authJwtService: IAuthJwtService
  readonly logger: ILoggerService
  execute(dto: AuthLoginLocalJwtRequest, oldRt: string | undefined): Promise<JwtTokens>
}
