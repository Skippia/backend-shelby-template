import { Catch } from '@nestjs/common'
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'

import type { AppRequest, AppResponse } from '@shared/modules/app'
import { Environment } from '@shared/modules/app'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import { ContextService } from '@shared/modules/context'

import { BaseCustomExceptionFilter, typeErrorExceptionHandler } from './base-exception-filter'

@Catch()
export class AllExceptionFilter extends BaseCustomExceptionFilter implements ExceptionFilter {
  SILENT_FILTER_ERRORS: boolean
  mapHandlers = {
    exceptions: {
      TypeError: typeErrorExceptionHandler,
    },
  } as const

  constructor(
    @InjectLogger(AllExceptionFilter.name) public logger: ILoggerService,
    configService: ConfigService,
    public contextService: ContextService,
  ) {
    super(logger)

    this.SILENT_FILTER_ERRORS = configService.get<boolean>(
      Environment.SILENT_FILTER_ERRORS,
    ) as boolean
  }

  catch(exception: Error, host: ArgumentsHost): void {
    if (!this.SILENT_FILTER_ERRORS) {
      // eslint-disable-next-line no-console
      console.log('EXCEPTION IN ALL-EXCEPTION-FILTER', JSON.stringify(exception, null, 2))
    }

    const request: AppRequest = this.contextService.getRequest()
    const response: AppResponse = this.contextService.getResponse()
    const exceptionName = exception.constructor.name

    /**
     * One of mapHandlers.exceptions is expected
     */
    if (this.isExpectedException(exceptionName)) {
      return this.handleExpectedException(exception, exceptionName, request, response)
    }

    /**
     * Handle as generic error (not prisma exception, ...)
     */
    return this.handleDefaultError(exception, request, response)
  }

  private isExpectedException(exceptionName: string): boolean {
    return Object.keys(this.mapHandlers.exceptions).includes(exceptionName)
  }

  private handleExpectedException(
    exception: TypeError,
    exceptionName: string,
    request: AppRequest,
    response: AppResponse,
  ): void {
    /**
     * Extract all information from prisma error
     */
    const { statusCode, message, stack, errorName } =
      this.mapHandlers.exceptions[exceptionName as keyof typeof this.mapHandlers.exceptions](
        exception,
      )

    /**
     * Log message
     */
    this.logMessage({ request, message, statusCode, stack })

    /**
     * Return error to the client
     */
    return this.handleResponse({
      request,
      response,
      statusCode,
      message,
      errorName,
    })
  }
}
