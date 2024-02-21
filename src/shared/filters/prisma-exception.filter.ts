import { Catch } from '@nestjs/common'
import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'

import { Prisma } from '@prisma/db'

import type { AppRequest, AppResponse } from '@shared/modules/app'
import { Environment } from '@shared/modules/app'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import { ContextService } from '@shared/modules/context'

import { BaseCustomExceptionFilter } from './base-exception-filter'
import {
  conflictErrorHandler,
  fkFailedErrorHandler,
  throwNotFoundHandler,
} from './prisma-exception-filter'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseCustomExceptionFilter implements ExceptionFilter {
  SILENT_FILTER_ERRORS: boolean
  mapHandlers = {
    prismaErrors: {
      P2002: conflictErrorHandler,
      P2003: fkFailedErrorHandler,
      P2025: throwNotFoundHandler,
    },
  } as const

  constructor(
    @InjectLogger(PrismaExceptionFilter.name)
    public logger: ILoggerService,
    public contextService: ContextService,
    configService: ConfigService,
  ) {
    super(logger)

    this.SILENT_FILTER_ERRORS = configService.get<boolean>(
      Environment.SILENT_FILTER_ERRORS,
    ) as boolean
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const error = exception

    if (!this.SILENT_FILTER_ERRORS) {
      // eslint-disable-next-line no-console
      console.error('Prisma EXCEPTION! error', JSON.stringify(error, null, 2))
    }

    const request: AppRequest = this.contextService.getRequest()
    const response: AppResponse = this.contextService.getResponse()

    /**
     * Check if our prisma code error is expected
     */
    if (this.isPrismaErrorCode(error)) {
      return this.handlePrismaError(error, request, response)
    }

    return this.handleDefaultError(error, request, response)
  }

  private isPrismaErrorCode(error: Prisma.PrismaClientKnownRequestError): boolean {
    return Object.keys(this.mapHandlers.prismaErrors).includes(error.code)
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    request: AppRequest,
    response: AppResponse,
  ): void {
    /**
     * Extract all information from prisma error
     */
    const code = error.code as keyof typeof this.mapHandlers.prismaErrors
    const prismaExtractedInfo = this.mapHandlers.prismaErrors[code](error)

    /**
     * Log message
     */
    this.logMessage({
      request,
      message: prismaExtractedInfo.message,
      statusCode: prismaExtractedInfo.statusCode,
    })

    /**
     * Return error to the client
     */
    return this.handleResponse(
      {
        request,
        response,
        statusCode: prismaExtractedInfo.statusCode,
        message: prismaExtractedInfo.message,
        errorName: prismaExtractedInfo.errorName,
      },
      prismaExtractedInfo,
    )
  }
}
