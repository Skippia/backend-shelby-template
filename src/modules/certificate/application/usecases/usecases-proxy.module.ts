import type { DynamicModule } from '@nestjs/common'

import { Module } from '@nestjs/common'

import { AuthJwtRepositoryModule } from '@auth-jwt/infrastructure/repositories'

import { CertificateRepositoryModule } from '@certificate/infrastructure/repositories'

import { PdfGeneratorModule } from '@certificate/infrastructure/adapters/pdf-generator'

import { GenerateSertificateUsecase } from './generate-certificate'
import { FindAllCertificatesUsecase } from './find-all-certificates'
import { FindOwnCertificatesUsecase } from './find-own-certificates'
import { DeleteCertificateUsecase } from './delete-certificate'

// TODO: prisma is need?
@Module({
  imports: [AuthJwtRepositoryModule, CertificateRepositoryModule, PdfGeneratorModule],
})
export class UsecasesProxyModule {
  static FIND_ALL_CERTIFICATES_USECASE = 'FIND_ALL_CERTIFICATES_USECASE'
  static FIND_OWN_CERTIFICATES_USECASE = 'FIND_ALL_CERTIFICATES_BY_USER_USECASE'
  static GENERATE_CERTIFICATE_USECASE = 'GENERATE_CERTIFICATE_USECASE'
  static DELETE_CERTIFICATES_USECASE = 'DELETE_CERTIFICATES_USECASE'

  static register(): DynamicModule {
    return {
      module: UsecasesProxyModule,
      providers: [
        {
          provide: UsecasesProxyModule.FIND_ALL_CERTIFICATES_USECASE,
          useClass: FindAllCertificatesUsecase,
        },
        {
          provide: UsecasesProxyModule.FIND_OWN_CERTIFICATES_USECASE,
          useClass: FindOwnCertificatesUsecase,
        },
        {
          provide: UsecasesProxyModule.GENERATE_CERTIFICATE_USECASE,
          useClass: GenerateSertificateUsecase,
        },
        {
          provide: UsecasesProxyModule.DELETE_CERTIFICATES_USECASE,
          useClass: DeleteCertificateUsecase,
        },
      ],
      exports: [
        UsecasesProxyModule.FIND_ALL_CERTIFICATES_USECASE,
        UsecasesProxyModule.FIND_OWN_CERTIFICATES_USECASE,
        UsecasesProxyModule.GENERATE_CERTIFICATE_USECASE,
        UsecasesProxyModule.DELETE_CERTIFICATES_USECASE,
      ],
    }
  }
}
