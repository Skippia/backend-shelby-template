import type { PrismaClient } from '@prisma/db'

import type { ICertificateRepository } from '@certificate/domain'
import type { ILoggerService } from '@shared/modules/logger'

export type IDeleteCertificateUsecase = {
  certificateRepository: ICertificateRepository<PrismaClient>
  logger: ILoggerService
  execute(certificateId: number): Promise<{ userId: number }>
}
