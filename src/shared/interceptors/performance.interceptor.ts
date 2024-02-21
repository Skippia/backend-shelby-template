// performance.interceptor.ts

import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Injectable } from '@nestjs/common'

import type { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

import { MeasurePerformance } from '@shared/helpers/others'
import { ILoggerService, InjectLogger } from '@shared/modules/logger'

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(@InjectLogger(PerformanceInterceptor.name) private logger: ILoggerService) {}
  intercept(_context: ExecutionContext, next: CallHandler): Observable<void> {
    const id = MeasurePerformance.start()

    return next.handle().pipe(
      tap(() => {
        MeasurePerformance.end(id, {
          customLogger: this.logger,
          customText: '[Performance]',
        })
      }),
    )
  }
}
