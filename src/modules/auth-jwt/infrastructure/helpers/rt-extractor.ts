import type { Request } from 'express'

import { JwtCookiesEnum } from '@auth-jwt/domain/helpers/types'

export const rtExtractor = (request: Request): string =>
  request.cookies?.[JwtCookiesEnum.REFRESH_TOKEN]
