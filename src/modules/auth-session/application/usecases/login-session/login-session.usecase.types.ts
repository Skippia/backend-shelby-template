import type { PrismaClient } from '@prisma/db'

import type { IAuthSessionRepository, UserEntity } from '@auth-session/domain'
import type { AuthLoginSessionRequest } from '@auth-session/presenter'

import type { ILoggerService } from '@shared/modules/logger'

export type ILoginSessionUsecase = {
  readonly authSessionRepository: IAuthSessionRepository<PrismaClient>
  readonly logger: ILoggerService
  execute(dto: AuthLoginSessionRequest): Promise<UserEntity>
}
