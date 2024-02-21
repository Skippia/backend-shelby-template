/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/member-ordering */
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import zlib from 'node:zlib'

import type { Redis } from 'ioredis'

import { windValueToArray } from '@shared/helpers/transformers'

import type {
  CacheGetParams,
  CacheProvider,
  TAcceptableGeneralDataCache,
  TGetCacheOptions,
} from './cache.types'
import { PromiseService } from '../promise/promise.service'
import { RedisService } from '../redis/redis.service'
import { generateBufferKey } from './cache.utils'
import { AppOptions, AppTraffic } from '../app'
import { ILoggerService, InjectLogger } from '../logger'
import { ContextService } from '../context'

@Injectable()
export class CacheService {
  private cacheProvider: CacheProvider
  private failureCount = 0
  private failureStart: number | undefined

  constructor(
    @Inject('APP_CONFIG') private readonly appOptions: AppOptions,
    @InjectLogger(CacheService.name)
    readonly logger: ILoggerService,
    private readonly promiseService: PromiseService,
    private readonly redisService: RedisService,
    private readonly contextService: ContextService,
  ) {
    this.setupProvider()
  }

  /**
   * Configures the cache provider, memory will be used
   * unless a Redis connection is provided.
   */
  private setupProvider(): void {
    /**
     * TODO: add here in-memory cache (later)
     */
    this.cacheProvider = this.redisService
  }

  /**
   * Acquires the underlying chosen cache provider.
   */
  public getProvider(): CacheProvider {
    return this.cacheProvider
  }

  /**
   * Builds caching key for current request.
   * @param params
   */
  public buildCacheDataKey(params: CacheGetParams, uniquePrefix: string): string {
    const {
      traffic: baseTraffic,
      hostname: baseHostname,
      method: baseMethod,
      path: basePath,
      query: baseQuery,
    } = params

    const traffic = baseTraffic || AppTraffic.INBOUND

    const hostname =
      traffic === AppTraffic.INBOUND ? this.contextService.getRequestHost() : baseHostname

    const method =
      traffic === AppTraffic.INBOUND ? this.contextService.getRequestMethod() : baseMethod

    const path =
      traffic === AppTraffic.INBOUND
        ? this.contextService.getRequest()?.url.split('?')[0]
        : basePath

    const query = traffic === AppTraffic.INBOUND ? this.contextService.getRequestQuery() : baseQuery

    const sortedQueryObject = Object.fromEntries(
      Object.entries(query || ({} as Record<string, unknown>)).sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    )
    const sortedQuery = new URLSearchParams(sortedQueryObject).toString()

    return `cache:${traffic}:${hostname}:${method}:${path}${sortedQuery ? `:${sortedQuery}` : ''}/${uniquePrefix}`
  }

  /**
   * Builds caching key for target bucket.
   * @param bucket
   */
  private buildCacheBucketKey(bucket: string): string {
    return `cache:bucket:${bucket}`
  }

  /**
   * Attempt to acquire cached data.
   *
   * In the event of a failure, blocks reading from cache for
   * 10 times the timeout to prevent a burst decompression which
   * might lead to a memory crash.
   * @param params
   */
  public async getCache<T extends TAcceptableGeneralDataCache>({
    params,
    timeout,
    serializable,
    uniqueSuffixCache,
  }: TGetCacheOptions): Promise<T | null> {
    const { failureThreshold, failureTtl } = this.appOptions.cache!

    try {
      if (this.failureStart && Date.now() > this.failureStart + (failureTtl || 0)) {
        this.failureCount = 0
        this.failureStart = undefined
      }

      if (this.failureCount > (failureThreshold || 0)) {
        throw new Error('cache service is offline')
      }

      return await this.promiseService.resolveOrTimeout(
        this.getCacheHandler(params, uniqueSuffixCache, serializable),
        timeout,
      )
    } catch (e: unknown) {
      /**
       * In the case of error we initialize failureStart (= current date)
       */
      this.failureStart ??= Date.now()
      this.failureCount++

      throw new InternalServerErrorException({
        message: `failed to acquire cached data | ${e instanceof Error ? e.message : ''}`,
        params,
      })
    }
  }

  /**
   * Acquire cached data for current request, for any route decorated
   * with `@Cache()` this method will be automatically called before
   * the request reaches the controller.
   * @param params
   */
  private async getCacheHandler<T extends TAcceptableGeneralDataCache>(
    params: CacheGetParams,
    uniqueSuffixCache: string,
    serializable: boolean,
  ): Promise<T | null> {
    const { enableCompression } = this.appOptions.cache!
    const dataKey = this.buildCacheDataKey(params, uniqueSuffixCache)
    let value: T

    try {
      if (serializable) {
        if (enableCompression) {
          value = (await this.cacheProvider.getBuffer(dataKey)) as T
          /**
           * If compression was enabled (only for `serializable = true`),
           * we need to decompress the data before it returning
           */
          const uncompressed: Buffer = await new Promise((res, rej) => {
            zlib.gunzip(value as Buffer, (e, d) => (e ? rej(e) : res(d)))
          })

          // eslint-disable-next-line require-atomic-updates
          return JSON.parse(uncompressed.toString())
        }

        return await this.cacheProvider.get(dataKey)
      }

      return (await this.cacheProvider.getBuffers(dataKey)) as T
    } catch (e) {
      this.logger.error(
        `[Cache]: Failed to get cache by key: ${dataKey}, error: ${JSON.stringify(e as Error)}`,
      )
      return null
    }
  }

  /**
   * Asynchronously sets cached data for current request, for any route
   * decorated with `@Cache()` this method will be automatically called\
   * before the response is sent to client.
   * @param value
   * @param params
   */
  public async setCache(
    value: string | number | Buffer | unknown[] | Record<string, unknown>,
    dataKey: string,
    ttl?: number,
  ): Promise<void> {
    const { enableCompression } = this.appOptions.cache!

    let data = value

    try {
      /**
       * this callback is used only if `serializable = true` => we don't need additional checks
       */
      if (enableCompression) {
        this.logger.trace('[Cache]: Enable compression for setting cache data')

        data = await new Promise((res, rej) => {
          zlib.gzip(Buffer.from(JSON.stringify(value)), (e, d) => (e ? rej(e) : res(d)))
        })
      }

      if (ttl) {
        await this.cacheProvider.set(dataKey, data, { ttl })
      } else {
        await this.cacheProvider.set(dataKey, data)
      }
    } catch (e) {
      this.logger.error(`[Cache]: Failed to set cache data, error: ${JSON.stringify(e as Error)}`)
    }
  }

  /**
   * If we want to store array of buffers we have such workflow:
   * 1. Create `Set` with dataKey name and store inside keys, under the which the buffers will be stored:
   *    Set -> dataKey: ['buffer#dataKey-1', 'buffer#dataKey-2', ...]
   * 2. Each key inside `Set` will store buffer:
   *    Hash: `buffer#dataKey-1` : Buffer
   *    Hash: `buffer#dataKey-2` : Buffer
   *    ...
   */
  public async setCacheForArrayOfBuffers(
    data: Buffer | Buffer[],
    dataKey: string,
    ttl?: number,
  ): Promise<void> {
    // 1. Convert Buffer | Buffer => Buffer[]
    const dataAsArray = windValueToArray(data)

    // 2. Generate buffer keys under the which will be stored buffers
    const bufferKeys: string[] = new Array(dataAsArray.length)
      .fill('*')
      .map((_, idx) => generateBufferKey(dataKey, idx + 1))

    try {
      // 3. Create Set which will store these keys
      await this.cacheProvider.sadd(dataKey, bufferKeys, { ttl })

      // 4. Save under these keys buffers
      await Promise.all(
        bufferKeys.map((key, idx) => this.cacheProvider.set(key, dataAsArray[idx], { ttl })),
      )
    } catch (e) {
      this.logger.error(
        `[Cache]: Failed to set cache for array of buffers. Datakey: ${dataKey}, BufferKeys: ${JSON.stringify(bufferKeys)}, Error : ${JSON.stringify(e as Error)}`,
      )
    }
  }

  /**
   * Asynchronously ties cached data for current request with
   * target buckets which can be individually invalidated.
   * @param buckets
   * @param params
   */
  public async setBuckets(buckets: string[], dataKey: string): Promise<void> {
    const { bucketTtl: ttl } = this.appOptions.cache!

    try {
      this.logger.trace('[Cache]: set buckets', buckets, dataKey)

      for (const bucket of buckets) {
        /**
         * @Example: cache:bucket:1
         */
        const bucketKey = this.buildCacheBucketKey(bucket)

        /**
         * We add the same dataKey either in one bucket or in multiple ones (usually into one)
         */
        await this.cacheProvider.sadd(bucketKey, dataKey, { ttl })
      }
    } catch (e) {
      // try {
      //   await this.promiseService.resolveLimited({
      //     data: buckets,
      //     limit: 1000,
      //     promise: async (b) => {
      //       const bucketKey = this.buildCacheBucketKey(b)
      //       const dataKey = this.buildCacheDataKey(params)
      //       console.log('🚀 ~ CacheService ~ promise: ~ dataKey:', dataKey)
      //       await this.cacheProvider.sadd(bucketKey, dataKey, { ttl })
      //     },
      //   })
      // }
      this.logger.error(
        `[Cache]: Failed to set cache buckets. Buckets: ${JSON.stringify(buckets)}), Error : ${JSON.stringify(e as Error)}`,
      )
    }
  }

  public async getAllBucketsIds(): Promise<string[]> {
    const redis: Redis = this.cacheProvider.getClient()

    return await redis.keys(this.buildCacheBucketKey('*'))
  }

  /**
   * Asynchronously invalidate target buckets which deletes
   * their related cache data keys.
   * @param buckets
   */
  public async invalidateBuckets(buckets: string[]): Promise<void> {
    const delPromises: Promise<void>[] = []

    try {
      this.logger.trace('[Cache]: invalidate with JSON')

      //   await this.promiseService.resolveLimited({
      //     data: buckets,
      //     limit: 1000,
      //     promise: async (bucket) => {
      //       // Get bucket key
      //       const bucketKey = this.buildCacheBucketKey(bucket)
      //       // Get all data related to this bucket
      //       const dataSet = await this.cacheProvider.smembers(bucketKey)
      //       // Add deferr task to delete bucket itself
      //       delPromises.push(this.cacheProvider.del(bucketKey) as Promise<void>)

      //       for (const dataKey of dataSet) {
      //         // Iterate over each member of bucket and add deffer task delete it as well
      //         delPromises.push(this.cacheProvider.del(dataKey) as Promise<void>)
      //       }
      //     },
      //   })

      for (const bucket of buckets) {
        /**
         * Get bucket key
         */
        const bucketKey = this.buildCacheBucketKey(bucket)
        /**
         * Get all keys related with this bucket key
         */
        const dataHashMapKeys = await this.cacheProvider.smembers(bucketKey)
        /**
         * Remove bucket itself by his key
         */
        delPromises.push(this.cacheProvider.del(bucketKey) as Promise<void>)
        /**
         * Remove all hashmaps related with keys from this bucket
         */
        dataHashMapKeys.map((dataHashMapKey) =>
          delPromises.push(this.cacheProvider.del(dataHashMapKey) as Promise<void>),
        )
      }

      // Delete all data related to this bucket(s) + bucket itself
      await Promise.all(delPromises)
    } catch (e) {
      this.logger.error(
        `[Cache]: Failed to invalidate cache buckets. Buckets: ${JSON.stringify(buckets)}), Error : ${JSON.stringify(e as Error)}`,
      )
    }
  }

  /**
   * 1. Entirely delete bucket(s)
   * 2. All Set(s) which can be found by keys are stored inside this bucket(s)
   * 3. All Hash map(s) which can be found by keys are stored inside this set(s)
   */
  public async invalidateBucketsWithBuffers(buckets: string[]): Promise<void> {
    const delPromises: Promise<void>[] = []

    this.logger.trace('[Cache]: invalidate with Buffer(s)')

    try {
      for (const bucket of buckets) {
        /**
         * Get bucket key
         */
        const bucketKey = this.buildCacheBucketKey(bucket)
        /**
         * Get all keys related with this bucket key
         */
        const dataSetKeys = await this.cacheProvider.smembers(bucketKey)

        /**
         * Remove bucket itself by his key
         */
        delPromises.push(this.cacheProvider.del(bucketKey) as Promise<void>)

        for (const dataSetKey of dataSetKeys) {
          const bufferHashMapKeys = await this.cacheProvider.smembers(dataSetKey)
          /**
           * Remove current data set (which stores bufferHashMapKeys)
           */
          delPromises.push(this.cacheProvider.del(dataSetKey) as Promise<void>)

          /**
           * Remove bufferHashMaps
           */
          bufferHashMapKeys.map((bufferHashMapKey) =>
            delPromises.push(this.cacheProvider.del(bufferHashMapKey) as Promise<void>),
          )
        }
      }

      await Promise.all(delPromises)

      // Delete all buckets themselfes + all sets in these buckets + all data in these sets
    } catch (e) {
      this.logger.error(
        `[Cache]: Failed to invalidate cache buckets with buffers. Buckets: ${JSON.stringify(buckets)}), Error : ${JSON.stringify(e as Error)}`,
      )
    }
  }
}
