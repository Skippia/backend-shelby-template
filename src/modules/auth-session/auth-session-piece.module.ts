import { Module } from '@nestjs/common'

import { AuthSessionController } from './presenter'
import { UsecasesProxyModule } from './application/usecases'

@Module({
  imports: [UsecasesProxyModule.register()],
  controllers: [AuthSessionController],
})
export class AuthSessionModulePiece {}
