import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'

import type { JwtPayload } from '@auth-jwt/domain/helpers/types'
import { IAuthJwtService } from '@auth-jwt/application/ports'

import type { AppRequest } from '@shared/modules/app'
import { Environment } from '@shared/modules/app'

import { AuthJwtModule } from '../adapters'
import { rtExtractor } from '../helpers'

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    @Inject(forwardRef(() => AuthJwtModule.SERVICE_TOKEN))
    private readonly authJwtService: IAuthJwtService,
  ) {
    super({
      /**
       * ! 1. First validation: if signature of token is invalid or secret key does not match,
       * !    automatically throw an error (401).
       */
      jwtFromRequest: ExtractJwt.fromExtractors([rtExtractor]),
      secretOrKey: config.get<string>(Environment.RT_SECRET),
      passReqToCallback: true,
    })
  }

  /**
   * ! 2. Second validation: it's manual validation (here we add own condition of successfull validation).
   * !    In our case a prerequisite is the availability of user in database with used id given in payload (from RT).
   * !    and the availability of RT session with used RT
   */
  async validate(req: AppRequest, payload: JwtPayload): Promise<JwtPayload> {
    // Unfortunately we can't avoid extracting RT one more time
    const rt = rtExtractor(req)

    await this.authJwtService.validateRefreshToken({
      rt,
      userId: payload.sub,
    })

    return payload
  }
}
