import type { PrismaClient } from '@prisma/db'

import type { IAuthSessionRepository } from '@auth-session/domain'

export type TValidateRtOption = { rt: string; userId: number }

export type IAuthSessionService = {
  //   authJwtRepository: IAuthSessionRepository<PrismaClient>
  //   generateJwtTokens(jwtInputData: JwtInputData): Promise<JwtTokens>
  //   refreshTokens(jwtInputData: JwtInputData, oldRt: string | undefined): Promise<JwtTokens>
  //   validateRefreshToken(option: TValidateRtOption): Promise<void>
  //   createRtSession(userId: number, rt: string): Promise<void>
}
