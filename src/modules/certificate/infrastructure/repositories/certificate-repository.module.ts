import { Module } from '@nestjs/common'

import { PrismaModule } from '@shared/modules/prisma/client'

import { CertificateRepository } from './certificate.repository'

@Module({
  imports: [PrismaModule.register()],
  providers: [
    {
      provide: CertificateRepositoryModule.CERTIFICATE_REPOSITORY_TOKEN,
      useClass: CertificateRepository,
    },
  ],
  exports: [CertificateRepositoryModule.CERTIFICATE_REPOSITORY_TOKEN],
})
export class CertificateRepositoryModule {
  static CERTIFICATE_REPOSITORY_TOKEN = 'CERTIFICATE_REPOSITORY_TOKEN'
}
