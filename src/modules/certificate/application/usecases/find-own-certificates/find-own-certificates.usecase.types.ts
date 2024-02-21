import type { PrismaClient } from '@prisma/db'

import type { ICertificateRepository } from '@certificate/domain'
import type { ILoggerService } from '@shared/modules/logger'

export type IFindOwnCertificatesUsecase = {
  certificateRepository: ICertificateRepository<PrismaClient>
  logger: ILoggerService
  execute(userId: number): Promise<Buffer | Buffer[] | null>
}
