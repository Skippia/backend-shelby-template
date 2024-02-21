import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { User, $Enums } from '@prisma/db'
import type { App } from 'supertest/types'

import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'

const _GP = APP_DEFAULT_OPTIONS.globalPrefix

export function findUserId(users: Pick<User, 'id' | 'roles'>[], userRole: $Enums.RoleEnum): number {
  return (users.find((user) => user.roles.includes(userRole)) as Pick<User, 'id' | 'roles'>).id
}

export async function loginLocalAsAdmin(app: INestApplication): Promise<string[]> {
  const credentials = {
    email: 'admin@gmail.com',
    password: 'midapa',
  }

  const { header } = await request(app.getHttpServer() as App)
    .post(`/${_GP}/auth/local/jwt/login`)
    .send({ ...credentials })

  const cookies = header['set-cookie'] as unknown as string[]

  return cookies
}
export async function loginLocalAsUser(app: INestApplication): Promise<string[]> {
  const credentials = {
    email: 'user@gmail.com',
    password: 'midapa',
  }

  const { header } = await request(app.getHttpServer() as App)
    .post(`/${_GP}/auth/local/jwt/login`)
    .send({ ...credentials })

  const cookies = header['set-cookie'] as unknown as string[]

  return cookies
}
