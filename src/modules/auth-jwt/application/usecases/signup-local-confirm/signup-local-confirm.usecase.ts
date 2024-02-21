import { NotFoundException } from '@nestjs/common'

import type { PrismaClient } from '@prisma/db'

import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'
import type { AuthSignupLocalConfirmRequest } from '@auth-jwt/presenter/dto'

import type { ILoggerService } from '@shared/modules/logger'

import type { ISignupLocalConfirmUsecase } from './signup-local-confirm.usecase.types'

export class SignupLocalConfirmUsecase implements ISignupLocalConfirmUsecase {
  constructor(
    readonly authJwtRepository: IAuthJwtRepository<PrismaClient>,
    readonly logger: ILoggerService,
  ) {}

  async execute(dto: AuthSignupLocalConfirmRequest): Promise<void> {
    this.logger.log('try to confirm email registration...')

    // 1. Check if user with such confirmation email token exists
    const userByConfirmationToken = await this.authJwtRepository.findUserByConfirmationToken(
      dto.token,
    )

    if (!userByConfirmationToken) {
      throw new NotFoundException("User with such confirmation token doesn't exist!")
    }

    // 2. Update confirmation status for selected user
    await this.authJwtRepository.confirmUserRegistration(userByConfirmationToken.id as number)
  }
}
