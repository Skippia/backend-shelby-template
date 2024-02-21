import { Module } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'

import { JwtModule, JwtService } from '@nestjs/jwt'

import { AtGuard, RtGuard } from '@auth-jwt/infrastructure/guards'
import { AuthJwtRepositoryModule } from '@auth-jwt/infrastructure/repositories'
import type { AuthJwtRepository } from '@auth-jwt/infrastructure/repositories'
import { AtStrategy, RtStrategy } from '@auth-jwt/infrastructure/strategies'

import { AuthJwtService } from './auth-jwt.service'

// Check the difference (singletone vs multitone during custom useFactory and useClass)
@Module({
  imports: [JwtModule.register({}), AuthJwtRepositoryModule],
  providers: [
    {
      inject: [JwtService, ConfigService, AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN],
      provide: AuthJwtModule.SERVICE_TOKEN,
      useFactory: (
        jwtService: JwtService,
        config: ConfigService,
        authJwtRepository: AuthJwtRepository,
      ): AuthJwtService => new AuthJwtService(jwtService, config, authJwtRepository),
    },
    AtStrategy,
    RtStrategy,
    AtGuard,
    RtGuard,
  ],
  exports: [AuthJwtModule.SERVICE_TOKEN],
})
export class AuthJwtModule {
  static SERVICE_TOKEN = 'JWT_SERVICE_TOKEN'
}
