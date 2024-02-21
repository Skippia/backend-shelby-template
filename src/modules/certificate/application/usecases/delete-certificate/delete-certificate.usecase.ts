import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common'

import type { PrismaClient } from '@prisma/db'

import { ICertificateRepository } from '@certificate/domain'

import { CertificateRepositoryModule } from '@certificate/infrastructure/repositories'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import type { IDeleteCertificateUsecase } from './delete-certificate.usecase.types'

@Injectable()
export class DeleteCertificateUsecase implements IDeleteCertificateUsecase {
  constructor(
    @Inject(CertificateRepositoryModule.CERTIFICATE_REPOSITORY_TOKEN)
    readonly certificateRepository: ICertificateRepository<PrismaClient>,
    @InjectLogger(DeleteCertificateUsecase.name)
    readonly logger: ILoggerService,
  ) {}

  async execute(certificateId: number): Promise<{ userId: number }> {
    this.logger.log(`try to delete certificate by id ${certificateId}...`)

    const { userId } = await this.certificateRepository.deleteCertificateById(certificateId)

    if (!userId) {
      throw new InternalServerErrorException(
        `Error during deleting certificate id = ${certificateId}`,
      )
    }

    return { userId }
  }
}
