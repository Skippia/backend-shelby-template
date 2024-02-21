import { Module } from '@nestjs/common'

import { PrismaModule } from '@shared/modules/prisma/client'

import { AuthMapper } from './auth-session.mapper'
import { AuthSessionRepository } from './auth-session.repository'

@Module({
  imports: [PrismaModule.register()],
  providers: [
    {
      provide: AuthSessionRepositoryModule.AUTH_SESSION_REPOSITORY_TOKEN,
      useClass: AuthSessionRepository,
    },
    AuthMapper,
  ],
  exports: [AuthSessionRepositoryModule.AUTH_SESSION_REPOSITORY_TOKEN],
})
export class AuthSessionRepositoryModule {
  static AUTH_SESSION_REPOSITORY_TOKEN = 'AUTH_SESSION_REPOSITORY_TOKEN'
}
