import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-custom'

import { UsecasesProxyModule, ILoginSessionUsecase } from '@auth-session/application/usecases'
import type { UserEntity } from '@auth-session/domain'
import type { AuthLoginSessionRequest } from '@auth-session/presenter'
import { InjectLogger, ILoggerService } from '@shared/modules/logger'

@Injectable()
export class SessionRedisStrategy extends PassportStrategy(Strategy, 'session-redis') {
  constructor(
    @Inject(forwardRef(() => UsecasesProxyModule.LOGIN_SESSION_USECASE))
    private readonly loginSessionUsecase: ILoginSessionUsecase,
    @InjectLogger(SessionRedisStrategy.name)
    readonly logger: ILoggerService,
  ) {
    super()
  }

  validate(req: Request, options: unknown): Promise<UserEntity> {
    const body = req.body as unknown as AuthLoginSessionRequest
    this.logger.trace('Call `SessionRedisStrategy.validate`')

    if (!body.email || !body.password) {
      throw new UnauthorizedException('Access Denied by lack of information')
    }

    return this.loginSessionUsecase.execute({
      email: body.email,
      password: body.password,
    })
  }
}
