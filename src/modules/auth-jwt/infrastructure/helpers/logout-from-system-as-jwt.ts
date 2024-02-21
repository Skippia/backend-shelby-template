import type { Response } from 'express'

import { JwtCookiesEnum } from '@auth-jwt/domain/helpers/types'

export const logoutFromSystemAsJwt = (res: Response): void => {
  res.clearCookie(JwtCookiesEnum.ACCESS_TOKEN)
  res.clearCookie(JwtCookiesEnum.REFRESH_TOKEN)
}
