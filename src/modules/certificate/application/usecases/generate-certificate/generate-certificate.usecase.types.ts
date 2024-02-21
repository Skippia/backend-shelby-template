import type { PrismaClient } from '@prisma/db'

import type { ICertificateRepository } from '@certificate/domain'
import type { CertificateGenerateContract } from '@certificate/presenter'
import type { ILoggerService } from '@shared/modules/logger'

export type IGenerateSertificateUsecase = {
  certificateRepository: ICertificateRepository<PrismaClient>
  logger: ILoggerService
  execute(dto: CertificateGenerateContract.CertificateGenerateRequest): Promise<void>
}
