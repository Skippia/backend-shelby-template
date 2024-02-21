import { Module } from '@nestjs/common'

import { AuthJwtController } from './presenter'
import { UsecasesProxyModule } from './application/usecases'

@Module({
  imports: [UsecasesProxyModule.register()],
  controllers: [AuthJwtController],
})
export class AuthJwtModulePiece {}
