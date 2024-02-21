import type { DynamicModule } from '@nestjs/common'

import { Module } from '@nestjs/common'

import type { LoggerOptions } from 'winston'

import { AuthJwtModule } from '@auth-jwt/infrastructure/adapters'
import { AuthJwtRepositoryModule } from '@auth-jwt/infrastructure/repositories'
import type { AuthJwtRepository } from '@auth-jwt/infrastructure/repositories'

import { WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN, WinstonLoggerService } from '@shared/modules/logger'

import { ContextService } from '@shared/modules/context'

import type { IMailService } from '@shared/modules/mail/application/ports'

import { MailModule } from '@shared/modules/mail/infrasructure/adapters/mail'

import { LoginLocalJwtUsecase } from './login-local-jwt'
import { SignupLocalUsecase } from './signup-local'
import { LogoutJwtUsecase } from './logout-jwt'
import type { IAuthJwtService } from '../ports'
import { RefreshJwtTokensUsecase } from './refresh-jwt/refresh-jwt-tokens.usecase'
import { SignupLocalConfirmUsecase } from './signup-local-confirm'
import { DeleteExpiredRtSessionsUsecase } from './delete-expired-rt-sessions'

@Module({
  imports: [AuthJwtRepositoryModule, AuthJwtModule, MailModule.register()],
})
export class UsecasesProxyModule {
  static SIGNUP_LOCAL_USECASE = 'SIGNUP_LOCAL_USECASE'
  static LOGIN_LOCAL_USECASE = 'LOGIN_LOCAL_USECASE'
  static LOGOUT_USECASE = 'LOGOUT_USECASE'
  static REFRESH_JWT_TOKENS_USECASE = 'REFRESH_JWT_TOKENS_USECASE'
  static CONFIRM_EMAIL_REGISTRATION = 'CONFIRM_EMAIL_REGISTRATION'
  static DELETE_EXPIRED_RT_SESSIONS = 'DELETE_EXPIRED_RT_SESSIONS'
  static register(): DynamicModule {
    return {
      module: UsecasesProxyModule,

      /**
       * ! We can either inject manually (useFactory + new) or use Nest.js DI system (useClass + @Injectable())
       * ! The difference between these two approaches is (apparently):
       * 1. In manual DI we can't control DI scope of class (f.e singlone or transient) (actually we can, but it's a complicated).
       * 2. In manual DI we more explicitly pass down dependencies via inject: [...] and then via constructor in target class.
       *    All dependencies of target class can be found in appropriate provider (where we create this instance),
       *    Using Nest.js DI, it automatically discovers needed tokens (from current module scope) and based on them automatically
       *    injects needed dependencies. In Nest.js DI we don't have one entrypoint of dependencies and must check each injection (source).
       * 3. In manual DI target class is outside of NestJS DI container system, so it has no dependencies injection within
       *    itslef and can be ported f.e to Express.js (since it depends on only interfaces).
       * ------------------------------------------------
       * I guess we need to use native NestJS DI + @Injectable() when:
       *    - target class should be Singletone of Request scope.
       *    - it doesn't have a lot of dependencies.
       * And use manual DI otherwise when:
       *    - it has a lot of dependencies (we should use manual DI for more explicitness and one entrypoint of dependencies).
       *    - we inject some class only once or it should be injected as transient
       */
      providers: [
        {
          inject: [
            AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN,
            MailModule.MAIL_SERVICE_TOKEN,
            ContextService,
            WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN,
          ],
          provide: UsecasesProxyModule.SIGNUP_LOCAL_USECASE,
          useFactory: (
            authJwtRepository: AuthJwtRepository,
            mailService: IMailService,
            contextService: ContextService,
            options: LoggerOptions,
          ): SignupLocalUsecase => {
            const logger = new WinstonLoggerService(options, contextService)
            logger.setContext(SignupLocalUsecase.name)

            return new SignupLocalUsecase(authJwtRepository, mailService, logger)
          },
        },
        {
          inject: [
            AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN,
            ContextService,
            WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN,
          ],
          provide: UsecasesProxyModule.CONFIRM_EMAIL_REGISTRATION,
          useFactory: (
            authJwtRepository: AuthJwtRepository,
            contextService: ContextService,
            options: LoggerOptions,
          ): SignupLocalConfirmUsecase => {
            const logger = new WinstonLoggerService(options, contextService)
            logger.setContext(SignupLocalUsecase.name)

            return new SignupLocalConfirmUsecase(authJwtRepository, logger)
          },
        },

        /**
         * ? We should understand that instead of manual DI (as in SingupLocalUsecase) we can
         * ? use use native NestJS DI + @Injectable() for Usecases itself (as in LoginLocalUsecase)
         */
        {
          provide: UsecasesProxyModule.LOGIN_LOCAL_USECASE,
          useClass: LoginLocalJwtUsecase,
        },
        {
          inject: [
            AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN,
            ContextService,
            WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN,
          ],
          provide: UsecasesProxyModule.LOGOUT_USECASE,
          useFactory: (
            authJwtRepository: AuthJwtRepository,
            contextService: ContextService,
            options: LoggerOptions,
          ): LogoutJwtUsecase => {
            const logger = new WinstonLoggerService(options, contextService)
            logger.setContext(LogoutJwtUsecase.name)

            return new LogoutJwtUsecase(authJwtRepository, logger)
          },
        },
        {
          inject: [
            AuthJwtModule.SERVICE_TOKEN,
            ContextService,
            WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN,
          ],
          provide: UsecasesProxyModule.REFRESH_JWT_TOKENS_USECASE,
          useFactory: (
            authJwtService: IAuthJwtService,
            contextService: ContextService,
            options: LoggerOptions,
          ): RefreshJwtTokensUsecase => {
            const logger = new WinstonLoggerService(options, contextService)
            logger.setContext(RefreshJwtTokensUsecase.name)

            return new RefreshJwtTokensUsecase(authJwtService, logger)
          },
        },
        {
          inject: [
            AuthJwtRepositoryModule.AUTH_JWT_REPOSITORY_TOKEN,
            ContextService,
            WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN,
          ],
          provide: UsecasesProxyModule.DELETE_EXPIRED_RT_SESSIONS,
          useFactory: (
            authJwtRepository: AuthJwtRepository,
            contextService: ContextService,
            options: LoggerOptions,
          ): DeleteExpiredRtSessionsUsecase => {
            const logger = new WinstonLoggerService(options, contextService)
            logger.setContext(DeleteExpiredRtSessionsUsecase.name)

            return new DeleteExpiredRtSessionsUsecase(authJwtRepository, logger)
          },
        },
      ],
      exports: [
        UsecasesProxyModule.SIGNUP_LOCAL_USECASE,
        UsecasesProxyModule.LOGIN_LOCAL_USECASE,
        UsecasesProxyModule.LOGOUT_USECASE,
        UsecasesProxyModule.REFRESH_JWT_TOKENS_USECASE,
        UsecasesProxyModule.CONFIRM_EMAIL_REGISTRATION,
        UsecasesProxyModule.DELETE_EXPIRED_RT_SESSIONS,
      ],
    }
  }
}
