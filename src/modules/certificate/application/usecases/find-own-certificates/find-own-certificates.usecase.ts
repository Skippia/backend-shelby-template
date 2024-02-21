import { Inject, Injectable } from '@nestjs/common'

import type { PrismaClient } from '@prisma/db'

import { ICertificateRepository } from '@certificate/domain'

import { CertificateRepositoryModule } from '@certificate/infrastructure/repositories'

import { InjectLogger, ILoggerService } from '@shared/modules/logger'

import type { IFindOwnCertificatesUsecase } from './find-own-certificates.usecase.types'

@Injectable()
export class FindOwnCertificatesUsecase implements IFindOwnCertificatesUsecase {
  constructor(
    @Inject(CertificateRepositoryModule.CERTIFICATE_REPOSITORY_TOKEN)
    readonly certificateRepository: ICertificateRepository<PrismaClient>,
    @InjectLogger(FindOwnCertificatesUsecase.name)
    readonly logger: ILoggerService,
  ) {}

  async execute(userId: number): Promise<Buffer | Buffer[] | null> {
    this.logger.log('try to find own certificates...')

    const certificates = await this.certificateRepository.findAllCertificatesByUserId(userId)

    if (!certificates) {
      return null
    }

    return certificates.length === 1 ? certificates[0] : certificates
  }
}
