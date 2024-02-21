import { Injectable, Inject, NotFoundException } from '@nestjs/common'

import { PrismaClient } from '@prisma/db'

import type { RTSessionEntity, UserEntity } from '@auth-jwt/domain/entities'
import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'

import { PrismaModule } from '@shared/modules/prisma/client'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import { AuthMapper } from './auth-jwt.mapper'

@Injectable()
export class AuthJwtRepository implements IAuthJwtRepository<PrismaClient> {
  constructor(
    @Inject(PrismaModule.PRISMA_CLIENT)
    private readonly prismaService: PrismaClient,
    private readonly authMapper: AuthMapper,
    @InjectLogger(AuthJwtRepository.name)
    private logger: ILoggerService,
  ) {}

  get proxy(): PrismaClient {
    return this.prismaService
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const maybeUser = await this.prismaService.user.findUnique({
      where: {
        email,
        isEmailConfirmed: true,
      },
    })

    this.logger.trace(`[Postgresql]:[findByEmail]: Query was handled with ${email}`)

    if (!maybeUser) {
      return null
    }

    return this.authMapper.toDomainUser(maybeUser)
  }

  async findUserById(id: number): Promise<UserEntity | null> {
    const maybeUser = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    })

    this.logger.trace(`[Postgresql]:[findById]: Query was handled with ${id}`)

    if (!maybeUser) {
      return null
    }

    return this.authMapper.toDomainUser(maybeUser)
  }

  async findUserByConfirmationToken(token: string): Promise<UserEntity | null> {
    const maybeUser = await this.prismaService.user.findUnique({
      where: {
        emailConfirmationToken: token,
      },
    })

    this.logger.trace(`[Postgresql]:[findByToken]: Query was handled with ${token}`)

    if (!maybeUser) {
      return null
    }

    return this.authMapper.toDomainUser(maybeUser)
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    const newUser = await this.prismaService.user.create(this.authMapper.toPersistenceUser(user))

    this.logger.trace(`[Postgresql]:[create]: Query was handled with ${JSON.stringify(user)}`)

    return this.authMapper.toDomainUser(newUser)
  }

  async confirmUserRegistration(id: number): Promise<void> {
    const maybeUser = await this.prismaService.user.update({
      select: {
        isEmailConfirmed: true,
      },
      where: {
        id,
      },
      data: {
        isEmailConfirmed: true,
        emailConfirmationToken: null,
      },
    })

    this.logger.trace(`[Postgresql]:[update]: Query was handled with ${JSON.stringify(id)}`)

    if (!maybeUser.isEmailConfirmed) {
      throw new NotFoundException(`Error during updating (confirm email) user with id = ${id}`)
    }
  }

  async createRtSession(data: RTSessionEntity): Promise<RTSessionEntity> {
    const rtSession = await this.prismaService.rTSession.create(
      this.authMapper.toPersistenceRtSession(data),
    )

    this.logger.trace(`[Postgresql]:[create]: Query was handled with ${JSON.stringify(data)}`)

    return this.authMapper.toDomainRtSession(rtSession)
  }

  async findRtSessionByRt(rt: string, exp: number): Promise<RTSessionEntity | null> {
    const maybeRtSession = await this.prismaService.rTSession.findUnique({
      where: {
        rt,
        rtExpDate: { gte: new Date(exp * 1000) },
      },
    })

    this.logger.trace(`[Postgresql]:[findByRt]: Query was handled with ${JSON.stringify(rt)}`)

    if (!maybeRtSession) {
      return null
    }

    return this.authMapper.toDomainRtSession(maybeRtSession)
  }

  async updateRtSessionByRt({
    oldRt,
    newRt,
    newExp,
  }: {
    oldRt: string
    newRt: string
    newExp: number
  }): Promise<void> {
    await this.prismaService.rTSession.update({
      where: {
        rt: oldRt,
      },
      data: {
        rtExpDate: new Date(newExp * 1000),
        rt: newRt,
      },
    })

    this.logger.trace(
      `[Postgresql]:[updateRtSessionByRt]: Query was handled. Next exp time is: ${Number(new Date(newExp * 1000))}`,
    )
  }

  async deleteRtSessionByRt(rt: string): Promise<void> {
    await this.prismaService.rTSession.delete({
      where: {
        rt,
      },
    })

    this.logger.trace(`[Postgresql]:[updateRtSessionByRt]: Query was handled with rt = ${rt}))}`)
  }

  async deleteExpiredRtSessions(): Promise<number> {
    const { count } = await this.prismaService.rTSession.deleteMany({
      where: {
        rtExpDate: {
          lt: new Date(),
        },
      },
    })

    this.logger.trace('[Postgresql]:[deleteExpiredRtSessions]: Query was handled')

    return count
  }
}
