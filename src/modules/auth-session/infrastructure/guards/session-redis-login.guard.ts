import type { ExecutionContext } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { InjectLogger, ILoggerService } from '@shared/modules/logger'

@Injectable()
export class SessionRedisLoginGuard extends AuthGuard('session-redis') {
  constructor(
    @InjectLogger(SessionRedisLoginGuard.name)
    readonly logger: ILoggerService,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Add your custom authentication logic here
    // ...
    this.logger.trace('Call `SessionRedisLoginGuard.canActivate`')

    const result = await (super.canActivate(context) as Promise<boolean>)

    //  Establish a session
    await super.logIn(context.switchToHttp().getRequest())

    return result
  }
}
