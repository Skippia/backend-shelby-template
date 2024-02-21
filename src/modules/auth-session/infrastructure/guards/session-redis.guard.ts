/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Injectable } from '@nestjs/common'

import type { Observable } from 'rxjs'

import { InjectLogger, ILoggerService } from '@shared/modules/logger'

@Injectable()
export class SessionRedisGuard implements CanActivate {
  constructor(
    @InjectLogger(SessionRedisGuard.name)
    readonly logger: ILoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.trace('Call `SessionRedisGuard`')

    return context.switchToHttp().getRequest().isAuthenticated()
  }
}
