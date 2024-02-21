import type { PrismaClient } from '@prisma/db'

import type { ICertificateRepository } from '@certificate/domain'
import type { ILoggerService } from '@shared/modules/logger'

export type IFindAllCertificatesUsecase = {
  certificateRepository: ICertificateRepository<PrismaClient>
  logger: ILoggerService
  execute(): Promise<Buffer | Buffer[] | null>
}
