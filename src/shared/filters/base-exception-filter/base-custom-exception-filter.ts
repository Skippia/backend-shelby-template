import type { HttpException, HttpStatus } from '@nestjs/common'

import { unwindArrayToValue } from '@shared/helpers/transformers'
import type { ILoggerService } from '@shared/modules/logger'
import type { AppRequest, AppResponse } from '@shared/modules/app'

export class BaseCustomExceptionFilter {
  constructor(protected logger: ILoggerService) {}

  protected handleResponse(
    {
      request,
      response,
      message,
      statusCode,
      errorName,
    }: {
      request: AppRequest
      response: AppResponse
      message: string
      statusCode: number
      errorName: string
    },
    additionalInfo?: { statusCode: HttpStatus; message: string } & Record<string, unknown>,
  ): void {
    const responseData = {
      message,
      statusCode,
      errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(additionalInfo ? additionalInfo : {}),
    }

    response.status(statusCode).json(responseData)
  }

  protected logMessage({
    request,
    message,
    stack,
    statusCode,
    errorName,
  }: {
    request: AppRequest
    message: string
    stack?: string
    statusCode: number
    errorName?: string
  }): void {
    if (statusCode >= 500) {
      this.logger.error(
        `End Request for ${request.path},
        method=${request.method} status=${statusCode},
        message=${message ? message : null},
        errorName=${errorName ? errorName : null},
        statusCode: ${statusCode >= 500 ? stack : ''}`,
      )
    } else {
      this.logger.warn(
        `End Request for ${request.path},
         method=${request.method} status=${statusCode}
         message=${message ? message : null},
         errorName=${errorName ? errorName : null}`,
      )
    }
  }

  // TODO: refactor
  protected extractErrorInformation(
    error:
      | (Error & {
          response?: {
            message: string | Array<string>
            statusCode: number
          }
        })
      | HttpException,
  ): { message: string; stack: string | undefined; statusCode: number; errorName: string } {
    /**
     * Try to extract this data from incoming error
     * else set default value
     */
    const _error = {
      // @ts-expect-error ...
      message: unwindArrayToValue(error.response?.message) || error.message || error.message.error,
      stack: error.stack,
      // @ts-expect-error 123
      statusCode: (error.getStatus
        ? // @ts-expect-error 123
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          error.getStatus()
        : // @ts-expect-error 123
          error.response?.statusCode || error.statusCode || error.status) as number,
      errorName: error.name,
    }

    const message = _error.message || 'Internal error'
    const stack = _error.stack
    const statusCode = _error.statusCode || 500
    const errorName = _error.errorName

    return { message, stack, statusCode, errorName }
  }

  /**
   * 1. Extract error information
   * 2. Log message
   * 3. Return error information to the client
   */
  protected handleDefaultError(
    error:
      | (Error & {
          response?: {
            message: string | Array<string>
            statusCode: number
          }
        })
      | HttpException,
    request: AppRequest,
    response: AppResponse,
  ): void {
    const { message, stack, statusCode, errorName } = this.extractErrorInformation(error)

    this.logMessage({ request, message, stack, statusCode, errorName })

    return this.handleResponse({
      request,
      response,
      message,
      statusCode,
      errorName,
    })
  }
}
