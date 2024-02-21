import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'

import { JwtCookiesEnum } from '@auth-jwt/domain/helpers/types'
import type { JwtPayload } from '@auth-jwt/domain/helpers/types'

import type { AppRequest } from '@shared/modules/app'
import { Environment } from '@shared/modules/app'

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      /**
       * ! 1. First validation: if signature of token is invalid or secret key does not match,
       * !    automatically throw an error (401).
       */
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: AppRequest): string => request.cookies?.[JwtCookiesEnum.ACCESS_TOKEN],
      ]),
      secretOrKey: config.get<string>(Environment.AT_SECRET),
    })
  }

  /**
   * ! 2. Second validation: it's manual validation (here we add own condition of successfull validation).
   * !    In our case there is not custom prerequisite.
   */
  validate(payload: JwtPayload): JwtPayload {
    return payload
  }
}
