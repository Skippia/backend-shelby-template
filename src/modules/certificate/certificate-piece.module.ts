import { Module } from '@nestjs/common'

import { CertificateController } from './presenter'
import { UsecasesProxyModule } from './application/usecases'

@Module({
  imports: [UsecasesProxyModule.register()],
  controllers: [CertificateController],
})
export class CertificateModulePiece {}
