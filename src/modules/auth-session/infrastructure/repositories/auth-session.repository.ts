import { Injectable, Inject } from '@nestjs/common'

import { PrismaClient } from '@prisma/db'

import type { IAuthSessionRepository, UserEntity } from '@auth-session/domain'

import { PrismaModule } from '@shared/modules/prisma/client'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import { AuthMapper } from './auth-session.mapper'

@Injectable()
export class AuthSessionRepository implements IAuthSessionRepository<PrismaClient> {
  constructor(
    @Inject(PrismaModule.PRISMA_CLIENT)
    private readonly prismaService: PrismaClient,
    private readonly authMapper: AuthMapper,
    @InjectLogger(AuthSessionRepository.name)
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
}
