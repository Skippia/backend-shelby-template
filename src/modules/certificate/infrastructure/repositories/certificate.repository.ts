import { Injectable, Inject } from '@nestjs/common'

import { PrismaClient } from '@prisma/db'

import { PrismaModule } from '@shared/modules/prisma/client'

import type { ICertificateRepository } from '@certificate/domain'
import { InjectLogger, ILoggerService } from '@shared/modules/logger'

@Injectable()
export class CertificateRepository implements ICertificateRepository<PrismaClient> {
  constructor(
    @Inject(PrismaModule.PRISMA_CLIENT)
    private readonly prismaService: PrismaClient,
    @InjectLogger(CertificateRepository.name)
    private logger: ILoggerService,
  ) {}

  get proxy(): PrismaClient {
    return this.prismaService
  }

  async generateCertificate(userId: number, certificateFile: Buffer): Promise<void> {
    await this.prismaService.certificate.create({
      data: {
        userId,
        file: certificateFile,
      },
    })

    this.logger.trace(`[Postgresql]:[generateCertificate]: Query was handled with ${userId}`)
  }

  async findAllCertificates(): Promise<Buffer[] | null> {
    const certificates = await this.prismaService.certificate.findMany()

    this.logger.trace('[Postgresql]:[findAllCertificates]: Query was handled')

    if (!certificates.length) {
      return null
    }

    return certificates.map((certificate) => certificate.file)
  }

  async findAllCertificatesByUserId(userId: number): Promise<Buffer[] | null> {
    const certificates = await this.prismaService.certificate.findMany({
      where: {
        userId,
      },
    })

    this.logger.trace(
      `[Postgresql]:[findAllCertificatesByUserId]: Query was handled with ${userId}`,
    )

    if (!certificates.length) {
      return null
    }

    return certificates.map((certificate) => certificate.file)
  }

  async deleteCertificateById(certificateId: number): Promise<{ userId: number }> {
    const { userId } = await this.prismaService.certificate.delete({
      where: {
        id: certificateId,
      },
      select: {
        userId: true,
      },
    })

    this.logger.trace(
      `[Postgresql]:[deleteCertificateById]: Query was handled with certificateId = ${certificateId}`,
    )

    return { userId }
  }
}
