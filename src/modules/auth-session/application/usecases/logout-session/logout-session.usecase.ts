import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import type { ILogoutSessionUsecase } from './logout-session.usecase.types'

export class LogoutSessionUsecase implements ILogoutSessionUsecase {
  constructor(
    @InjectLogger(LogoutSessionUsecase.name)
    readonly logger: ILoggerService,
  ) {}

  execute(): void {
    this.logger.log('try logout...')
  }
}
