import { Inject, Injectable } from '@nestjs/common'

import type { PrismaClient } from '@prisma/db'

import { ICertificateRepository } from '@certificate/domain'

import { CertificateRepositoryModule } from '@certificate/infrastructure/repositories'

import { InjectLogger, ILoggerService } from '@shared/modules/logger'

import type { IFindAllCertificatesUsecase } from './find-all-certificates.usecase.types'

@Injectable()
export class FindAllCertificatesUsecase implements IFindAllCertificatesUsecase {
  constructor(
    @Inject(CertificateRepositoryModule.CERTIFICATE_REPOSITORY_TOKEN)
    readonly certificateRepository: ICertificateRepository<PrismaClient>,
    @InjectLogger(FindAllCertificatesUsecase.name)
    readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<Buffer | Buffer[] | null> {
    this.logger.log('try to find all certificates...')

    const certificates = await this.certificateRepository.findAllCertificates()

    if (!certificates) {
      return null
    }

    return certificates.length === 1 ? certificates[0] : certificates
  }
}
