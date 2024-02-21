import type { PrismaClient } from '@prisma/db'

import type { IAuthSessionService } from '@auth-session/application/ports'
import type { IAuthSessionRepository } from '@auth-session/domain'

export class AuthSessionService implements IAuthSessionService {
  constructor(public readonly authSessionRepository: IAuthSessionRepository<PrismaClient>) {}

  //   async generateJwtTokens(jwtInputData: JwtInputData): Promise<JwtTokens> {
  //     const { userId, email, roles, username } = jwtInputData

  //     const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
  //       sub: userId,
  //       email,
  //       username,
  //       roles,
  //     }

  //     const [at, rt] = await Promise.all([
  //       this.jwtService.signAsync(jwtPayload, {
  //         secret: this.config.get<string>(Environment.AT_SECRET),
  //         expiresIn: `${EXPIRES_IN_AT_MINUTES}m`,
  //       }),
  //       this.jwtService.signAsync(jwtPayload, {
  //         secret: this.config.get<string>(Environment.RT_SECRET),
  //         expiresIn: `${EXPIRES_IN_RT_MINUTES}m`,
  //       }),
  //     ])

  //     return {
  //       accessToken: at,
  //       refreshToken: rt,
  //     }
  //   }

  //   async refreshTokens(jwtInputData: JwtInputData, oldRt?: string): Promise<JwtTokens> {
  //     // 1. Generate new pair of tokens (AT + RT)
  //     const newTokens = await this.generateJwtTokens(jwtInputData)

  //     /**
  //      * If rt session is already exists (for existing rt) - update existing one (prolong expiration time + replace RT),
  //      */
  //     if (oldRt) {
  //       const existingRtSession = await this.authJwtRepository.findRtSessionByRt(
  //         oldRt,
  //         jwtInputData.userId,
  //       )

  //       /**
  //        * User has existing rt session
  //        */
  //       if (existingRtSession) {
  //         // Extract expiration time from new generated rt
  //         const { exp: newExp } = this.jwtService.decode(newTokens.refreshToken)

  //         // Prolong expiration time and replace old RT with new one
  //         await this.authJwtRepository.updateRtSessionByRt({
  //           oldRt,
  //           newRt: newTokens.refreshToken,
  //           newExp,
  //         })

  //         return newTokens
  //       }
  //     }

  //     /**
  //      * User doesn't have existing rt => create new session based on generated rt
  //      */

  //     await this.createRtSession(jwtInputData.userId, newTokens.refreshToken)

  //     return newTokens
  //   }

  //   async createRtSession(userId: number, rt: string): Promise<void> {
  //     const { exp } = this.jwtService.decode(rt)

  //     await this.authJwtRepository.createRtSession(
  //       new RTSessionEntity({
  //         id: null,
  //         rt,
  //         rtExpDate: new Date(exp * 1000),
  //         userAgent: null,
  //         updatedAt: null,
  //         createdAt: null,
  //         userId,
  //       }),
  //     )
  //   }

  //   async validateRefreshToken({ userId, rt }: TValidateRtOption): Promise<void> {
  //     const user = await this.authJwtRepository.findUserById(userId)

  //     // 1. Check if user with such RT exists
  //     if (!user) {
  //       throw new ForbiddenException(`User with id ${userId} is not exist`)
  //     }

  //     const { exp } = this.jwtService.decode(rt)

  //     const rtSession = await this.authJwtRepository.findRtSessionByRt(rt, exp as number)

  //     // 2. Check if rt session with such RT exists
  //     if (!rtSession) {
  //       throw new ForbiddenException(`There is not RT with rt = ${rt}`)
  //     }
  //   }
}
