import { Global, Module } from '@nestjs/common'
import type { DynamicModule } from '@nestjs/common'
import type { LoggerOptions } from 'winston'

import { ConfigService } from '@nestjs/config'

import type { LogSeverity, TEnvironment } from '@shared/modules/app'
import { Environment } from '@shared/modules/app'

import { WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN, initializeDefaultOptions } from './winston.config'
import { getLoggerContexts, getLoggerToken } from './winston.decorator'
import { WinstonLoggerService } from './winston.service'
import { ASYNC_STORAGE_TOKEN } from './logger.constants'
import { ContextModule, ContextService, ContextStorage } from '../context'

@Global()
@Module({
  imports: [ContextModule],
})
export class WinstonLoggerModule {
  static register(customOptions: LoggerOptions = {}): DynamicModule {
    // ["UserContoller", "AuthController", ...]
    const contexts = getLoggerContexts()

    return {
      module: WinstonLoggerModule,
      providers: [
        {
          provide: ASYNC_STORAGE_TOKEN,
          useValue: ContextStorage,
        },
        {
          inject: [ConfigService],
          provide: WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN,
          useFactory: (configService: ConfigService): LoggerOptions => {
            const loggerTransports = configService.get(
              Environment.TRANSPORT_LEVELS,
            ) as TEnvironment['TRANSPORT_LEVELS']
            const maximumLogLevel = configService.get(Environment.MAXIMUM_LOG_LEVEL) as LogSeverity

            const options: LoggerOptions = {
              ...initializeDefaultOptions(loggerTransports, maximumLogLevel),
              ...customOptions,
            }
            return options
          },
        },
        ...contexts.map((context) => ({
          // ["WinstonLoggerService:PrismaExceptionFilter", "WinstonLoggerService:AuthJwtRepository", ...]
          provide: getLoggerToken(context),
          inject: [WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN, ContextService],
          useFactory: (
            options: LoggerOptions,
            contextService: ContextService,
          ): WinstonLoggerService => {
            const logger = new WinstonLoggerService(options, contextService)

            logger.setContext(context)

            return logger
          },
        })),
      ],
      exports: [
        ASYNC_STORAGE_TOKEN,
        WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN,
        ...contexts.map((context) => getLoggerToken(context)),
      ],
    }
  }
}
