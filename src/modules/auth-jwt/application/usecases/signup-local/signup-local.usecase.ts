import { BadRequestException, InternalServerErrorException } from '@nestjs/common'

import { hashSync } from 'bcrypt'

import type { PrismaClient } from '@prisma/db'
import { $Enums } from '@prisma/db'

import { UserEntity } from '@auth-jwt/domain/entities'
import { HASH_SALT } from '@auth-jwt/domain/helpers/constants'
import type { IAuthJwtRepository } from '@auth-jwt/domain/repositoryInterfaces'
import type { AuthSignupLocalRequest } from '@auth-jwt/presenter/dto'

import type { ILoggerService } from '@shared/modules/logger'

import type { IMailService } from '@shared/modules/mail/application/ports'

import type { ISignupLocalUsecase } from './signup-local.usecase.types'

export class SignupLocalUsecase implements ISignupLocalUsecase {
  constructor(
    readonly authJwtRepository: IAuthJwtRepository<PrismaClient>,
    readonly mailService: IMailService,
    readonly logger: ILoggerService,
  ) {}

  async execute(dto: AuthSignupLocalRequest): Promise<UserEntity> {
    this.logger.log('try to signup...')

    // 1. Check if user with such email already exists
    const isUserWithEmailAlreadyExists = await this.authJwtRepository.findUserByEmail(dto.email)

    if (isUserWithEmailAlreadyExists) {
      throw new BadRequestException('User with such email already exists!')
    }

    // 2. Create and save user into database
    const emailConfirmationToken = Math.floor(1000 + Math.random() * 9000).toString()

    const newUser = await this.authJwtRepository.createUser(
      new UserEntity({
        id: null,
        email: dto.email,
        username: dto.username,
        password: hashSync(dto.password, HASH_SALT),
        provider: $Enums.AuthProviderEnum.LOCAL,
        roles: [$Enums.RoleEnum.USER],
        isEmailConfirmed: false,
        emailConfirmationToken,
      }),
    )

    if (!newUser) {
      throw new InternalServerErrorException('Error during creating user')
    }

    // 3. Send email confirmation
    await this.mailService.sendSignupConfirmation(
      { username: newUser.username as string, email: newUser.email as string },
      emailConfirmationToken,
    )

    return newUser
  }
}
