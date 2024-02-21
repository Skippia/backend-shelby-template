import type { ILoggerService } from '@shared/modules/logger'

export type ILogoutJwtUsecase = {
  readonly logger: ILoggerService
  execute(maybeRt: string | undefined): Promise<void>
}
