import type { ILoggerService } from '@shared/modules/logger'

export type ILogoutSessionUsecase = {
  readonly logger: ILoggerService
  execute(): void
}
