/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-shadow */
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { User } from '@prisma/db'

import type { App } from 'supertest/types'
import { initApp } from 'test/helpers/common'

import { errorShape, sessionShape } from 'test/helpers/common/shapes'

import { ScheduleModule } from '@nestjs/schedule'

import { createUsers, rawUserInputData } from 'test/helpers/create'

import { PrismaModule } from '@shared/modules/prisma/client'
import type { PrismaService } from '@shared/modules/prisma/client'

import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'
import { CacheModule } from '@shared/modules/cache'
import type { CacheService } from '@shared/modules/cache'

import { AuthSessionModulePiece } from './auth-session-piece.module'

/**
 * 1. Login
 *  - failure login (wrong email)
 *  - failure login (wrong password)
 *  - successfull login + creating session
 * 2. Get data for protected endpoint (successfully)
 * 3. Logout
 *  - successfull logout + deleting session
 *  - failure logout (already were logged out)
 * 4. Get data for protected endpoint (failure)
 */
describe('Auth endpoints (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let cache: CacheService
  let currentCookies: string[] | undefined
  const credentials1 = rawUserInputData[0]

  const _GP = APP_DEFAULT_OPTIONS.globalPrefix

  async function runInitDataMigration(
    prisma: PrismaService,
  ): Promise<Pick<User, 'id' | 'roles'>[]> {
    return await createUsers(prisma)
  }

  beforeAll(async () => {
    app = await initApp({
      imports: [PrismaModule.register(), ScheduleModule.forRoot(), AuthSessionModulePiece],
      disableOptions: {
        disableCache: false,
      },
    })

    prisma = app.get<PrismaService>(PrismaModule.PRISMA_CLIENT)
    cache = app.get<CacheService>(CacheModule.CACHE_SERVICE_TOKEN)

    await prisma.clearDatabase()
    await cache.getProvider().flushdb()
    await runInitDataMigration(prisma)
  })

  afterAll(async () => {
    await prisma.clearDatabase()
    await cache.getProvider().flushdb()
    await app.close()
  })

  /** 1. Login */
  describe(`[ POST ${_GP}/auth/session/login ]`, () => {
    it('should failure login (wrong email)', async () => {
      const { status, header, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/session/login`)
        .send({
          email: `x${credentials1.email}`,
          password: credentials1.password,
        })

      if (header?.['set-cookie']) {
        currentCookies = header['set-cookie'] as unknown as string[] | undefined
      }

      const sessionIdAvailable = (currentCookies || []).findIndex((str) =>
        str.startsWith('session_id'),
      )

      expect(status).toBe(401)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
      expect(sessionIdAvailable).toBe(-1)
    })

    it('should failure login (wrong password)', async () => {
      const { status, header, headers, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/session/login`)
        .send({
          email: credentials1.email,
          password: `x${credentials1.password}`,
        })

      if (header?.['set-cookie']) {
        currentCookies = header['set-cookie'] as unknown as string[] | undefined
      }

      const sessionIdAvailable = (currentCookies || []).findIndex((str) =>
        str.startsWith('session_id'),
      )

      expect(status).toBe(401)
      expect(headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(body).toStrictEqual(errorShape)
      expect(sessionIdAvailable).toBe(-1)
    })

    it('should sussessfully login', async () => {
      const { status, header, body } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/session/login`)
        .send({
          email: credentials1.email,
          password: credentials1.password,
        })

      if (header?.['set-cookie']) {
        currentCookies = header['set-cookie'] as unknown as string[] | undefined
      }

      const sessionIdAvailable = (currentCookies || []).findIndex((str) =>
        str.startsWith('session_id'),
      )

      expect(status).toBe(200)
      expect(body).toEqual({
        email: credentials1.email,
      })
      expect(sessionIdAvailable).not.toBe(-1)
    })
  })

  /** 2. Get data for protected endpoint (successfully) */
  describe(`[ POST ${_GP}/auth/session/status ]`, () => {
    it('should sussessfully get protected data', async () => {
      const { status, body } = await request(app.getHttpServer() as App)
        .get(`/${_GP}/auth/session/status`)
        .set('Cookie', currentCookies as string[])

      expect(status).toBe(200)
      expect(body).toStrictEqual(sessionShape)
    })
  })

  /** 3. Logout */
  describe(`[ POST ${_GP}/auth/session/logout ]`, () => {
    it('successfull logout + deleting session', async () => {
      const { status, body, header } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/session/logout`)
        .set('Cookie', currentCookies as string[])

      if (header?.['set-cookie']) {
        // eslint-disable-next-line require-atomic-updates
        currentCookies = header['set-cookie'] as unknown as string[] | undefined
      }

      expect(status).toBe(204)
      expect(body).toEqual({})
    })

    it('failure logout (already were logged out)', async () => {
      const { status, body, header } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/auth/session/logout`)
        .set('Cookie', currentCookies as string[])

      if (header?.['set-cookie']) {
        // eslint-disable-next-line require-atomic-updates
        currentCookies = header['set-cookie'] as unknown as string[] | undefined
      }

      expect(status).toBe(403)
      expect(body).toStrictEqual(errorShape)
    })
  })

  /** 4. Get data for protected endpoint (falure) */
  describe(`[ POST ${_GP}/auth/session/status ]`, () => {
    it('should failure get protected data', async () => {
      const { status, body } = await request(app.getHttpServer() as App)
        .get(`/${_GP}/auth/session/status`)
        .set('Cookie', currentCookies as string[])

      expect(status).toBe(403)
      expect(body).toStrictEqual(errorShape)
    })
  })
})
