import type { IAuthJwtService } from '@auth-jwt/application/ports'
import type { AuthRefreshJwtTokensRequest } from '@auth-jwt/presenter/dto'
import type { JwtTokens } from '@auth-jwt/domain/helpers/types'

import type { ILoggerService } from '@shared/modules/logger'

export type IRefreshJwtTokensUsecase = {
  readonly authJwtService: IAuthJwtService
  readonly logger: ILoggerService
  execute(dto: AuthRefreshJwtTokensRequest, oldRt: string): Promise<JwtTokens>
}
