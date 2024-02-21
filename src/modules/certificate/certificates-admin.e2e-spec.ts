/* eslint-disable @typescript-eslint/no-shadow */
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'

import type { App } from 'supertest/types'
import {
  findUserId,
  getAmountOfAllCertificates,
  getAmountOfCertificatesByUserId,
  initApp,
  loginLocalAsAdmin,
} from 'test/helpers/common'

import { createUsers } from 'test/helpers/create'

import { ScheduleModule } from '@nestjs/schedule'

import type { User } from '@prisma/db'
import { $Enums } from '@prisma/db'

import { AuthJwtModulePiece } from '@auth-jwt/auth-jwt-piece.module'

import { PrismaModule } from '@shared/modules/prisma/client'
import type { PrismaService } from '@shared/modules/prisma/client'

import { CertificateModulePiece } from '@certificate/certificate-piece.module'
import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'
import type { CacheService } from '@shared/modules/cache'
import { CacheModule } from '@shared/modules/cache'
import { MailModule } from '@shared/modules/mail/infrasructure/adapters/mail'

/**
 * 1. Generate 1 own certificate
 * 2. Get 1 own certificate
 * 3. Success attempt to generate certificate (for himself)
 * 4. Success attempt to generate certificate (for another user)
 * 5. Get 2 own certificate
 * 6. Success attempt to get all certificate (3 counts)
 */
describe('Certificates endpoints (ADMIN role) (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let cache: CacheService
  let users: Pick<User, 'id' | 'roles'>[]
  let userIdAdminRole: number
  let userIdUserRole: number
  let currentCookies: string[]
  const _GP = APP_DEFAULT_OPTIONS.globalPrefix

  async function runInitDataMigration(
    prisma: PrismaService,
  ): Promise<Pick<User, 'id' | 'roles'>[]> {
    return await createUsers(prisma)
  }

  beforeAll(async () => {
    app = await initApp({
      imports: [
        PrismaModule.register(),
        ScheduleModule.forRoot(),
        MailModule.register(),
        AuthJwtModulePiece,
        CertificateModulePiece,
      ],
      disableOptions: {
        disableCache: false,
      },
    })

    prisma = app.get<PrismaService>(PrismaModule.PRISMA_CLIENT)
    cache = app.get<CacheService>(CacheModule.CACHE_SERVICE_TOKEN)

    await prisma.clearDatabase()
    await cache.getProvider().flushdb()

    users = await runInitDataMigration(prisma)
    userIdAdminRole = findUserId(users, $Enums.RoleEnum.ADMIN)
    userIdUserRole = findUserId(users, $Enums.RoleEnum.USER)

    currentCookies = await loginLocalAsAdmin(app)
  })

  afterAll(async () => {
    await prisma.clearDatabase()
    await cache.getProvider().flushdb()
    await app.close()
  })

  /** 1 */
  describe(`[ POST ${_GP}/certificate/generate/own ]`, () => {
    it('should generate new certificate for current user', async () => {
      const { status } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/certificate/generate/own`)
        .set('Cookie', currentCookies)

      expect(status).toBe(201)
    })
  })

  /** 2 */
  describe(`[ GET ${_GP}/certificate/own ]`, () => {
    it('should return 1 own certificate as PDF file', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .get(`/${_GP}/certificate/own`)
        .set('Cookie', currentCookies)

      const amountOfCertificatesForThisUser = await getAmountOfCertificatesByUserId(
        prisma,
        userIdAdminRole,
      )

      expect(status).toBe(200)
      expect(headers['content-type']).toEqual('application/pdf')
      expect(body).toBeInstanceOf(Buffer)
      expect(amountOfCertificatesForThisUser).toBe(1)
    })
  })

  /** 3 */
  describe(`[ POST ${_GP}/certificate/generate ]`, () => {
    it('should successfully generate new certificate for current user', async () => {
      const { status } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/certificate/generate`)
        .send({
          userId: userIdAdminRole,
        })
        .set('Cookie', currentCookies)

      expect(status).toBe(201)
    })
  })

  /** 4 */
  describe(`[ POST ${_GP}/certificate/generate ]`, () => {
    it('should successfully generate new certificate for another user', async () => {
      const { status } = await request(app.getHttpServer() as App)
        .post(`/${_GP}/certificate/generate`)
        .send({
          userId: userIdUserRole,
        })
        .set('Cookie', currentCookies)

      expect(status).toBe(201)
    })
  })

  /** 5 */
  describe(`[ GET ${_GP}/certificate/own ]`, () => {
    it('should return 2 own certificate as ZIP file', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .get(`/${_GP}/certificate/own`)
        .set('Cookie', currentCookies)

      const amountOfCertificatesForThisUser = await getAmountOfCertificatesByUserId(
        prisma,
        userIdAdminRole,
      )

      expect(status).toBe(200)
      expect(headers['content-type']).toEqual('application/zip')
      expect(body).toEqual({})
      expect(amountOfCertificatesForThisUser).toBe(2)
    })
  })

  /** 6 */
  describe(`[ GET ${_GP}/certificate ]`, () => {
    it('should successfully return all 3 certificates', async () => {
      const { status, headers, body } = await request(app.getHttpServer() as App)
        .get(`/${_GP}/certificate`)
        .set('Cookie', currentCookies)

      const amountOfAllCertificates = await getAmountOfAllCertificates(prisma)

      expect(status).toBe(200)
      expect(headers['content-type']).toEqual('application/zip')
      expect(body).toEqual({})
      expect(amountOfAllCertificates).toBe(3)
    })
  })
})
