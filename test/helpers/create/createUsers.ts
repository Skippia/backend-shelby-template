import type { User, Prisma } from '@prisma/db'
import { $Enums } from '@prisma/db'
import * as bcrypt from 'bcrypt'

import { HASH_SALT } from '@auth-jwt/domain/helpers/constants'

import type { PrismaService } from '@shared/modules/prisma/client'

export const rawUserInputData: Prisma.UserCreateInput[] = [
  {
    email: 'admin@gmail.com',
    username: 'admin',
    password: 'midapa',
    roles: [$Enums.RoleEnum.ADMIN],
    provider: $Enums.AuthProviderEnum.LOCAL,
    isEmailConfirmed: true,
  },
  {
    email: 'user@gmail.com',
    username: 'user',
    password: 'midapa',
    roles: [$Enums.RoleEnum.USER],
    provider: $Enums.AuthProviderEnum.LOCAL,
    isEmailConfirmed: true,
  },
]

export const userInputData = rawUserInputData.map((data) => ({
  ...data,
  password: bcrypt.hashSync(data.password as string, HASH_SALT),
}))

export async function createUsers(prisma: PrismaService): Promise<Pick<User, 'id' | 'roles'>[]> {
  const users = await prisma.$transaction(
    userInputData.map((user) => prisma.user.create({ data: user })),
  )

  return users.map((user) => ({ id: user.id, roles: user.roles }))
}
