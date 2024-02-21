import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

import { InjectLogger } from './winston.decorator'
import { ILoggerService } from './logger.types'
import { LOG_TYPE } from './logger.constants'
import { ContextService } from '../context'
import { AppOptions } from '../app'
import { AppService } from '../app/app.service'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectLogger(LoggingInterceptor.name) private logger: ILoggerService,
    private readonly contextService: ContextService,
    @Inject('APP_CONFIG') private readonly appOptions: AppOptions,
    private readonly appService: AppService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      const startDate = Date.now()
      const { enableRequestBody, enableResponseBody } = this.appOptions.logs || {}

      // do something that is only important in the context of regular HTTP requests (REST)

      this.logger.http(
        JSON.stringify({
          type: LOG_TYPE.REQUEST_ARGS,
          method: this.contextService.getRequestMethod(),
          host: this.contextService.getRequestHost(),
          path: this.contextService.getRequestPath(),
          clientIp: this.contextService.getRequestIp(),
          params: this.contextService.getRequestParams(),
          query: this.contextService.getRequestQuery(),
          headers: this.contextService.getRequestHeaders(),
          body: enableRequestBody ? this.contextService.getRequestBody() : undefined,
        }),
      )

      return next.handle().pipe(
        // eslint-disable-next-line @typescript-eslint/require-await
        mergeMap(async (data) => {
          const code = this.contextService.getResponseCode() || HttpStatus.OK

          this.logger.http(
            JSON.stringify({
              type: LOG_TYPE.RESPONSE_RESULT,
              duration: `${Date.now() - startDate}ms`,
              code,
              body: enableResponseBody ? data : undefined,
            }),
          )

          //   this.appService.collectInboundTelemetry(code)

          return data
        }),
      )
    }
    return next.handle()
  }
}
