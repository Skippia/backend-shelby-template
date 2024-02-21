import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import type { PrismaClient } from '@prisma/db'

import { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'

import { AuthJwtRepositoryModule } from '@auth-jwt/infrastructure/repositories'

import { ICertificateRepository } from '@certificate/domain'

import { CertificateRepositoryModule } from '@certificate/infrastructure/repositories'

import { PdfGeneratorModule } from '@certificate/infrastructure/adapters/pdf-generator'
import { IPdfGeneratorService } from '@certificate/application/ports'

import type { CertificateGenerateContract } from '@certificate/presenter'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import type { IGenerateSertificateUsecase } from './generate-certificate.usecase.types'

@Injectable()
export class GenerateSertificateUsecase implements IGenerateSertificateUsecase {
  constructor(
    @Inject(CertificateRepositoryModule.CERTIFICATE_REPOSITORY_TOKEN)
    readonly certificateRepository: ICertificateRepository<PrismaClient>,
    @Inject(AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN)
    readonly authJwtRepository: IAuthJwtRepository<PrismaClient>,
    @Inject(PdfGeneratorModule.PDF_SERVICE_TOKEN)
    readonly pdfGeneratorService: IPdfGeneratorService,
    @InjectLogger(CertificateRepositoryModule.name)
    readonly logger: ILoggerService,
  ) {}

  async execute(dto: CertificateGenerateContract.CertificateGenerateRequest): Promise<void> {
    this.logger.log('try to find all certificates...')

    // 1. Get user from db
    const user = await this.authJwtRepository.findUserById(dto.userId)

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // 2. Generate pdf file and save it in Buffer
    const fileBuffer = await this.pdfGeneratorService.generatePdfCertificateForUser(user)

    // 3. Save pdf certificate as Buffer into db
    await this.certificateRepository.generateCertificate(dto.userId, fileBuffer)
  }
}
