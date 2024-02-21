import { Module } from '@nestjs/common'

import { PrismaModule } from '@shared/modules/prisma/client'

import { AuthMapper } from './auth-jwt.mapper'
import { AuthJwtRepository } from './auth-jwt.repository'

@Module({
  imports: [PrismaModule.register()],
  providers: [
    {
      provide: AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN,
      useClass: AuthJwtRepository,
    },
    AuthMapper,
  ],
  exports: [AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN],
})
export class AuthJwtRepositoryModule {
  static AUTH_JWT_REPOSITORY_TOKEN = 'AUTH_JWT_REPOSITORY_TOKEN'
}
