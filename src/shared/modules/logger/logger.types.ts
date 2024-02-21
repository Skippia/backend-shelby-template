import type { LoggerService } from '@nestjs/common'

export type ILoggerService = LoggerService & {
  /**
   * Write a 'http' level log (kinda as middleware for http requests (before / after)).
   */
  http(message: string, ...optionalParams: unknown[]): unknown
  setContext(serviceName: string): void
  getTraceId(): string | undefined
  /**
   * Write an 'error' level log.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trace(message: any, ...optionalParams: any[]): any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: any, ...optionalParams: any[]): any
}

export type LogOptions = {
  /** Enables logging request bodies. */
  enableRequestBody?: boolean
  /** Enables logging response bodies. */
  enableResponseBody?: boolean
}
