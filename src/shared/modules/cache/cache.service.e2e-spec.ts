/* eslint-disable @darraghor/nestjs-typed/api-method-should-specify-api-response */
/* eslint-disable @darraghor/nestjs-typed/controllers-should-supply-api-tags */
import type { INestApplication } from '@nestjs/common'
import { Controller, Get, HttpStatus, Inject, Module, Patch, UseInterceptors } from '@nestjs/common'
import supertest from 'supertest'
import { setTimeout } from 'timers/promises'

import type { App } from 'supertest/types'

import fs from 'fs'

import path from 'path'

import { initApp } from 'test/helpers/common'

import { streamToBuffer } from '@shared/helpers/transformers'

import { TransformInStreamableFileInterceptorAsPdfOrZip } from '@certificate/presenter/interceptors'

import { Cache } from './cache.decorator'
import { APP_DEFAULT_OPTIONS, AppOptions } from '../app'
import { CacheStatus } from './cache.enum'
import type { CacheService } from './cache.service'
import { CacheModule } from './cache.module'

const defaultTtl = 1000

@Controller('cache')
class CacheTestController {
  constructor(@Inject('APP_CONFIG') private readonly appOptions: AppOptions) {}

  @Get('no-buckets')
  public getCacheNoBuckets(): { randomNumber: number } {
    return { randomNumber: Math.random() }
  }

  @Cache({
    ttl: defaultTtl,
    serializable: false,
    buckets: () => 'some-file',
    uniqueSuffix: 'same',
  })
  @Get('one-file')
  @UseInterceptors(TransformInStreamableFileInterceptorAsPdfOrZip)
  public async getOneFile(): Promise<Buffer> {
    const oneFile = fs.createReadStream(
      path.join(process.cwd(), `${this.appOptions.assetsPrefix}/image.png`),
    )

    return await streamToBuffer(oneFile)
  }

  @Cache({
    ttl: defaultTtl,
    serializable: false,
    buckets: () => 'some-file',
    uniqueSuffix: 'same',
  })
  @Get('many-files')
  @UseInterceptors(TransformInStreamableFileInterceptorAsPdfOrZip)
  public async getManyFiles(): Promise<Buffer[]> {
    const oneFile = fs.createReadStream(
      path.join(process.cwd(), `${this.appOptions.assetsPrefix}/image.png`),
    )
    const secondFile = fs.createReadStream(
      path.join(process.cwd(), `${this.appOptions.assetsPrefix}/image.png`),
    )

    /** Emultating returning array of files */
    return await Promise.all([streamToBuffer(oneFile), streamToBuffer(secondFile)])
  }

  @Cache({
    ttl: defaultTtl,
    buckets: ({ req }) => [req.params.id, '10'],
    uniqueSuffix: ({ req }) => req.params.id,
  })
  @Get(':id')
  public getCacheById(): { randomNumber: number } {
    return { randomNumber: Math.random() }
  }

  /**
   * Just for invalidating cache
   */
  @Cache({
    invalidate: ({ req }) => [req.params.id],
  })
  @Patch(':id')
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public patchCache(): void {}
}

@Module({
  controllers: [CacheTestController],
})
class CacheTestModule {}

describe('CacheService', () => {
  let app: INestApplication
  let httpServer: App
  let cache: CacheService
  const _GP = APP_DEFAULT_OPTIONS.globalPrefix

  beforeAll(async () => {
    app = await initApp({
      imports: [CacheTestModule],
      disableOptions: {
        disableCache: false,
      },
    })

    cache = app.get<CacheService>(CacheModule.CACHE_SERVICE_TOKEN)
    httpServer = app.getHttpServer()

    // TODO: fix, somehow it breaks tests from redis.service.integration-spec.ts related with resetting TTL
    await cache.getProvider().flushdb()
  })

  afterAll(async () => {
    await cache.getProvider().flushdb()
    await app.close()
  })

  describe('GET /cache/:id', () => {
    it('should not cache response when no buckets are specified (cache disabled at all)', async () => {
      const res1 = await supertest(httpServer).get(`/${_GP}/cache/no-buckets`).send()

      const res2 = await supertest(httpServer).get(`/${_GP}/cache/no-buckets`).send()

      expect(res1.statusCode).toBe(HttpStatus.OK)
      expect(res2.statusCode).toBe(HttpStatus.OK)
      expect(res1.body.randomNumber === res2.body.randomNumber).toBe(false)
    })

    it('should cache response using id as bucket (cache is enabled)', async () => {
      const res1 = await supertest(httpServer).get(`/${_GP}/cache/1`).send()
      const res2 = await supertest(httpServer).get(`/${_GP}/cache/1`).send()

      expect(res1.statusCode).toBe(HttpStatus.OK)
      expect(res2.statusCode).toBe(HttpStatus.OK)
      expect(res1.body.randomNumber === res2.body.randomNumber).toBe(true)
    })

    it('should invalidate cache after ttl has elapsed', async () => {
      const res1 = await supertest(httpServer).get(`/${_GP}/cache/2`).send()

      await setTimeout(defaultTtl * 1.5)

      const res2 = await supertest(httpServer).get(`/${_GP}/cache/2`).send()

      expect(res1.statusCode).toBe(HttpStatus.OK)
      expect(res2.statusCode).toBe(HttpStatus.OK)
      expect(res1.body.randomNumber === res2.body.randomNumber).toBe(false)
    })

    it('should invalidate cache using id as bucket', async () => {
      const res1 = await supertest(httpServer).get(`/${_GP}/cache/3`).send()

      await supertest(httpServer).patch(`/${_GP}/cache/3`).send()
      await setTimeout(200)

      const res2 = await supertest(httpServer).get(`/${_GP}/cache/3`).send()

      expect(res1.statusCode).toBe(HttpStatus.OK)
      expect(res2.statusCode).toBe(HttpStatus.OK)
      expect(res1.body.randomNumber === res2.body.randomNumber).toBe(false)
    })

    it('should invalidate cache using an indirect bucket', async () => {
      const res1 = await supertest(httpServer).get(`/${_GP}/cache/9`).send()

      const buckets1 = await supertest(httpServer).get(`/${_GP}/bucket`).send()

      await supertest(httpServer).patch(`/${_GP}/cache/10`).send()

      await setTimeout(200)

      const buckets2 = await supertest(httpServer).get(`/${_GP}/bucket`).send()

      const res2 = await supertest(httpServer).get(`/${_GP}/cache/9`).send()

      expect(res1.statusCode).toBe(HttpStatus.OK)
      expect(res2.statusCode).toBe(HttpStatus.OK)
      expect(res1.body.randomNumber === res2.body.randomNumber).toBe(false)
      expect(buckets1.body.buckets.length - buckets2.body.buckets.length).toBe(1)
    })

    it('should get `one file` not from cache (serializable = false)', async () => {
      const res = await supertest(httpServer).get(`/${_GP}/cache/one-file`).send()

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(res.headers['cache-status']).toEqual(CacheStatus.MISS)
      expect(res.headers['content-type']).toEqual('application/pdf')
    })

    it('should get `one file as pdf` from cache (serializable = false)', async () => {
      const res = await supertest(httpServer).get(`/${_GP}/cache/one-file`).send()

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(res.headers['cache-status']).toEqual(CacheStatus.HIT)
      expect(res.headers['content-type']).toEqual('application/pdf')
    })

    it('should get `many files as zip` not from cache (serializable = false)', async () => {
      const res = await supertest(httpServer).get(`/${_GP}/cache/many-files`).send()

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(res.headers['cache-status']).toEqual(CacheStatus.MISS)
      expect(res.headers['content-type']).toEqual('application/zip')
    })

    it('should get `many files as zip` from cache (serializable = false)', async () => {
      const res = await supertest(httpServer).get(`/${_GP}/cache/many-files`).send()

      expect(res.statusCode).toBe(HttpStatus.OK)
      expect(res.headers['cache-status']).toEqual(CacheStatus.HIT)
      expect(res.headers['content-type']).toEqual('application/zip')
    })
  })
})
