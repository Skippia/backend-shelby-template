import type { IAuthJwtService } from '@auth-jwt/application/ports'
import type { AuthRefreshJwtTokensRequest } from '@auth-jwt/presenter/dto'

import type { JwtInputData, JwtTokens } from '@auth-jwt/domain/helpers/types'

import type { ILoggerService } from '@shared/modules/logger'

import type { IRefreshJwtTokensUsecase } from './refresh-jwt-tokens.usecase.types'

export class RefreshJwtTokensUsecase implements IRefreshJwtTokensUsecase {
  constructor(
    readonly authJwtService: IAuthJwtService,
    readonly logger: ILoggerService,
  ) {}

  async execute(dto: AuthRefreshJwtTokensRequest, oldRt: string): Promise<JwtTokens> {
    this.logger.log('try to update jwt refresh tokens...')

    const jwtInputData: JwtInputData = {
      email: dto.email,
      username: dto.username,
      userId: dto.sub,
      roles: dto.roles,
    }

    const newPairTokens = await this.authJwtService.refreshTokens(jwtInputData, oldRt)

    return newPairTokens
  }
}
