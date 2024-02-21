import type { JwtService } from '@nestjs/jwt'

import type { PrismaClient } from '@prisma/db'

import type { JwtInputData, JwtTokens } from '@auth-jwt/domain/helpers/types'
import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'

export type TValidateRtOption = { rt: string; userId: number }

export type IAuthJwtService = {
  jwtService: JwtService
  authJwtRepository: IAuthJwtRepository<PrismaClient>

  generateJwtTokens(jwtInputData: JwtInputData): Promise<JwtTokens>
  refreshTokens(jwtInputData: JwtInputData, oldRt: string | undefined): Promise<JwtTokens>
  validateRefreshToken(option: TValidateRtOption): Promise<void>
  createRtSession(userId: number, rt: string): Promise<void>
}
