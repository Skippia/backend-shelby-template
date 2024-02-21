import type { UserEntity } from '@auth-jwt/domain/entities'

import type { UnixDate } from '@shared/helpers/types'

export enum JwtCookiesEnum {
  'ACCESS_TOKEN' = 'ACCESS_TOKEN',
  'REFRESH_TOKEN' = 'REFRESH_TOKEN',
}

export type JwtInputData = Pick<UserEntity, 'email' | 'username' | 'roles'> & { userId: number }

export type JwtPayload = Omit<JwtInputData, 'userId'> & {
  sub: number
  iat: UnixDate
  exp: UnixDate
}
export type JwtTokens = {
  accessToken: string
  refreshToken: string
}

export type JwtPayloadWithRt = JwtPayload & Pick<JwtTokens, 'refreshToken'>
