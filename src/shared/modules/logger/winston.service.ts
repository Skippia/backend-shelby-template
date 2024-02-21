import { ConsoleLogger } from '@nestjs/common'
import { createLogger } from 'winston'
import type { Logger as WinstonLogger, LoggerOptions } from 'winston'

import { LogSeverity } from '@shared/modules/app'

import type { ILoggerService } from './logger.types'
import type { ContextService } from '../context'

export class WinstonLoggerService extends ConsoleLogger implements ILoggerService {
  private logger: WinstonLogger

  constructor(
    readonly config: LoggerOptions,
    readonly contextService: ContextService,
  ) {
    super()
    this.logger = createLogger(config)

    this.logger.on('error', (error) => {
      // handle errors in the logger here
      // eslint-disable-next-line no-console
      console.error('Error in logger:', error)
    })
  }

  error(message: string): void {
    this.logger.log({
      level: LogSeverity.ERROR,
      message,
      traceId: this.getTraceId(),
    })
  }

  warn(message: string): void {
    this.logger.log({
      level: LogSeverity.WARN,
      message,
      traceId: this.getTraceId(),
    })
  }

  log(message: string): void {
    this.logger.log({
      level: LogSeverity.INFO,
      message,
      traceId: this.getTraceId(),
    })
  }

  http(message: string): void {
    this.logger.log({
      level: LogSeverity.HTTP,
      message,
      traceId: this.getTraceId(),
    })
  }

  verbose(message: string): void {
    this.logger.log({
      level: LogSeverity.VERBOSE,
      message,
      traceId: this.getTraceId(),
    })
  }

  debug(message: string): void {
    this.logger.log({
      level: LogSeverity.DEBUG,
      message,
      traceId: this.getTraceId(),
    })
  }

  trace(message: string): void {
    this.logger.log({
      level: LogSeverity.TRACE,
      message,
      traceId: this.getTraceId(),
    })
  }

  setContext(serviceName: string): void {
    this.logger.defaultMeta = {
      ...this.logger.defaultMeta,
      service: serviceName,
    }
  }

  getTraceId(): string | undefined {
    return this.contextService.getRequestTraceId()
  }
}
