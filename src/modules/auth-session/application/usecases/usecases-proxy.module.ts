import type { DynamicModule } from '@nestjs/common'

import { Module } from '@nestjs/common'

import { AuthSessionRepositoryModule } from '@auth-session/infrastructure/repositories'

import { AuthSessionModule } from '@auth-session/infrastructure/auth-session'

import { LoginSessionUsecase } from './login-session'
import { LogoutSessionUsecase } from './logout-session'

@Module({
  imports: [AuthSessionRepositoryModule, AuthSessionModule.register()],
})
export class UsecasesProxyModule {
  static LOGIN_SESSION_USECASE = 'LOGIN_SESSION_USECASE'
  static LOGOUT_SESSION_USECASE = 'LOGOUT_SESSION_USECASE'

  static register(): DynamicModule {
    return {
      module: UsecasesProxyModule,

      providers: [
        {
          provide: UsecasesProxyModule.LOGIN_SESSION_USECASE,
          useClass: LoginSessionUsecase,
        },
        {
          provide: UsecasesProxyModule.LOGOUT_SESSION_USECASE,
          useClass: LogoutSessionUsecase,
        },
      ],
      exports: [
        UsecasesProxyModule.LOGIN_SESSION_USECASE,
        UsecasesProxyModule.LOGOUT_SESSION_USECASE,
      ],
    }
  }
}
