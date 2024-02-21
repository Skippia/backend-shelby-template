/* eslint-disable @typescript-eslint/no-shadow */
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'

import type { App } from 'supertest/types'
import { getAmountOfRtSessionsByUserId, getTokenInfoByUserId, initApp } from 'test/helpers/common'

import { errorShape } from 'test/helpers/common/shapes'

import { ScheduleModule } from '@nestjs/schedule'

import type { AuthSignupLocalRequest } from '@auth-jwt/presenter/dto'

import { AuthJwtModulePiece } from '@auth-jwt/auth-jwt-piece.module'

import { PrismaModule } from '@shared/modules/prisma/client'
import type { PrismaService } from '@shared/modules/prisma/client'

import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'
import { CacheModule } from '@shared/modules/cache'
import type { CacheService } from '@shared/modules/cache'
import { MailModule } from '@shared/modules/mail/infrasructure/adapters/mail'

/**
 * 1. Signup
 *  - success creating
 *  - failure creating (email collision)
 *  - failure creating (username collision)
 *  - failure creating (password less than 8 symbols)
 *  - failure creating (invalid email format)
 *  - failure creating (invalid username format)
 *  - failure creating (invalid fields)
 * 2. Confirmation token
 *  - successfull confirmation of signup
 * 3. Login
 *  - successfull login
 *  - failure login (wrong email)
 *  - failure login (wrong password)
 * 4. Logout
 *  - successfull logout
 *  - failure logout (already were logged out)
 * 5. Refresh JWT
 *  - wrong refresh token (we are not authorized)
 *  - wrong refresh token (expired)
 *  - successfull refresh
 */
describe('Auth endpoints (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let cache: CacheService
  let userId: number
  let currentCookies: string[]
  const credentials1: AuthSignupLocalRequest = {
    email: 'midapa@gmail.com',
    username: 'midapa',
    password: 'qwerty123',
  }
  const _GP = APP_DEFAULT_OPTIONS.globalPrefix

  beforeAll(async () => {
    app = await initApp({
      imports: [
        PrismaModule.register(),
        ScheduleModule.forRoot(),
        MailModule.register(),
        AuthJwtModulePiece,
      ],
      disableOptions: {
        disableCache: false,
      },
    })

    prisma = app.get<PrismaService>(PrismaModule.PRISMA_CLIENT)
    cache = app.get<CacheService>(CacheModule.CACHE_SERVICE_TOKEN)

    await prisma.clearDatabase()
    await cache.getProvider().flushdb()
  })

  afterAll(async () => {
    await prisma.clearDatabase()
    await cache.getProvider().flushdb()
    await app.close()
  })

  /** 1. Signup */
  describe(`[ POST ${_GP}/auth/local/signup ]`, () => {
    it('should sussessfully singup new user', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/signup`)
        .send(credentials1)
      userId = body.id
      expect(status).toBe(201)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toEqual({
        email: credentials1.email,
        username: credentials1.username,
        roles: ['USER'],
        provider: 'LOCAL',
        id: body.id,
      })
    })

    it('should failure singup new user (email collision)', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/signup`)
        .send({
          email: credentials1.email,
          username: `${credentials1.username}2`,
          password: 'qwerty123',
        })

      expect(status).toBe(409)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
    })

    it('should failure singup new user (username collision)', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/signup`)
        .send({
          email: `x${credentials1.email}`,
          username: credentials1.username,
          password: 'qwerty123',
        })

      expect(status).toBe(409)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
    })

    it('should failure singup new user (invalid email format)', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/signup`)
        .send({
          email: `${credentials1.email}2`,
          username: `${credentials1.username}2`,
          password: 'qwerty123',
        })

      expect(status).toBe(400)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
    })

    it('should failure singup new user (invalid username format)', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/signup`)
        .send({
          email: `${credentials1.email}2`,
          username: true,
          password: 'qwerty123',
        })

      expect(status).toBe(400)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
    })

    it('should failure singup new user (invalid fields)', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/signup`)
        .send({
          email: `${credentials1.email}`,
          username: `${credentials1.username}2`,
        })

      expect(status).toBe(400)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
    })
  })

  /** 2. Confirmation token */
  describe(`[ POST ${_GP}/auth/local/confirm ]`, () => {
    it('should sussessfully confirm user via email token', async () => {
      const {
        emailConfirmationToken: beforeEmailConfirmationToken,
        isEmailConfirmed: beforeIsEmailConfirmed,
      } = await getTokenInfoByUserId(prisma, userId)

      const { status } = await request(app.getHttpServer() as App).get(
        `/${_GP}/auth/local/confirm?token=${beforeEmailConfirmationToken}`,
      )

      const {
        emailConfirmationToken: afterEmailConfirmationToken,
        isEmailConfirmed: afterIsEmailConfirmed,
      } = await getTokenInfoByUserId(prisma, userId)

      expect(beforeEmailConfirmationToken).toEqual(expect.any(String))
      expect(beforeIsEmailConfirmed).toBe(false)
      expect(afterIsEmailConfirmed).toBe(true)
      expect(afterEmailConfirmationToken).toBe(null)
      expect(status).toBe(301)
    })
  })

  /** 3. Login */
  describe(`[ POST ${_GP}/auth/local/jwt/login ]`, () => {
    it('should sussessfully login', async () => {
      const amountOfRtSessionsByUserIdBeforeLogin = await getAmountOfRtSessionsByUserId(
        prisma,
        userId,
      )

      const { status, header, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/jwt/login`)
        .send({
          email: credentials1.email,
          password: credentials1.password,
        })

      const amountOfRtSessionsByUserIdAfterLogin = await getAmountOfRtSessionsByUserId(
        prisma,
        userId,
      )

      currentCookies = header['set-cookie'] as unknown as string[]

      expect(amountOfRtSessionsByUserIdBeforeLogin).toBe(0)
      expect(amountOfRtSessionsByUserIdAfterLogin).toBe(1)
      expect(status).toBe(204)
      expect(body).toEqual({})
    })

    it('should failure login (wrong email)', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/jwt/login`)
        .send({
          email: `x${credentials1.email}`,
          password: credentials1.password,
        })

      expect(status).toBe(401)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
    })

    it('should failure login (wrong password)', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/jwt/login`)
        .send({
          email: credentials1.email,
          password: `x${credentials1.password}`,
        })

      expect(status).toBe(401)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
    })
  })

  /** 4. Logout */
  describe(`[ POST ${_GP}/auth/jwt/logout ]`, () => {
    it('should sussessfully logout', async () => {
      const amountOfRtSessionsByUserIdBeforeLogout = await getAmountOfRtSessionsByUserId(
        prisma,
        userId,
      )

      const { status, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/jwt/logout`)
        .set('Cookie', currentCookies)

      const amountOfRtSessionsByUserIdAfterLogout = await getAmountOfRtSessionsByUserId(
        prisma,
        userId,
      )

      expect(status).toBe(204)
      expect(body).toEqual({})
      expect(amountOfRtSessionsByUserIdBeforeLogout).toBe(1)
      expect(amountOfRtSessionsByUserIdAfterLogout).toBe(0)
    })

    it('should failure logout', async () => {
      const { status, body } = await request(app.getHttpServer() as App).post(
        `/${_GP}/auth/jwt/logout`,
      )

      expect(status).toBe(401)
      expect(body).toStrictEqual(errorShape)
    })
  })

  /** 5. Refresh JWT */
  describe(`[ POST ${_GP}/auth/local/jwt/refresh ]`, () => {
    it('should failure refresh JWT (wrong JWT)', async () => {
      const { status, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/jwt/refresh`)
        .set('Cookie', currentCookies)

      expect(status).toBe(403)
      expect(body).toStrictEqual(errorShape)
    })

    it('should failure refresh JWT (not authorized)', async () => {
      const { status, body } = await request(app.getHttpServer() as App).post(
        `/${_GP}/auth/local/jwt/refresh`,
      )

      expect(status).toBe(401)
      expect(body).toStrictEqual(errorShape)
    })

    it('should successfully refresh JWT', async () => {
      const amountOfRtSessionsByUserIdBeforeLogin = await getAmountOfRtSessionsByUserId(
        prisma,
        userId,
      )

      const { header } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/jwt/login`)
        .send({
          email: credentials1.email,
          password: credentials1.password,
        })

      const amountOfRtSessionsByUserIdAfterLogin = await getAmountOfRtSessionsByUserId(
        prisma,
        userId,
      )

      currentCookies = header['set-cookie'] as unknown as string[]

      const { status, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/local/jwt/refresh`)
        .set('Cookie', currentCookies)

      const amountOfRtSessionsByUserIdAfterRefreshJWT = await getAmountOfRtSessionsByUserId(
        prisma,
        userId,
      )
      expect(amountOfRtSessionsByUserIdBeforeLogin).toBe(0)
      expect(amountOfRtSessionsByUserIdAfterLogin).toBe(1)
      expect(amountOfRtSessionsByUserIdAfterRefreshJWT).toBe(1)
      expect(status).toBe(204)
      expect(body).toEqual({})
    })
  })
})
