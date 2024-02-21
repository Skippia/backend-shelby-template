import type { AppRequest, AppTraffic } from '../app'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type CacheGetParams = {
  traffic?: AppTraffic
  hostname?: string
  query?: Record<string, any>
  method: string
  path: string
}

export type CacheSetParams = {
  ttl: number
  timeout: number
} & CacheGetParams

export type CacheTtlOptions = {
  /** Time to live in milliseconds. */
  ttl?: number
}

export type CacheRouteOptionBucketWithSame<T extends TAcceptableGeneralDataCache> = {
  /**
   * Unique is key which is needed for creating unique suffix for member inside target bucket,
   * because our path url can rely on internal context data (f.e req.user.sub), we need provide it explicitly.
   * 'same' - is used when you have only one bucket and want to use the same unique pattern as for bucket.
   * Or you can pass down manual callback which will return another unique string.
   */
  uniqueSuffix: 'same' | ((params: CacheRouteBucketParams<T>) => string)
  /** Which buckets to automatically set based on current request and response data. */
  buckets(params: CacheRouteBucketParams<T>): string
  /** Which buckets to immediately invalidate based on current request and response data.
   * usually it only one bucket, but can be multiple as well
   */
}

export type CacheRouteOptionBucketWithoutSame<T extends TAcceptableGeneralDataCache> = {
  /**
   * Unique is key which is needed for creating unique suffix for member inside target bucket,
   * because our path url can rely on internal context data (f.e req.user.sub), we need provide it explicitly.
   * 'same' - is used when you have only one bucket and want to use the same unique pattern as for bucket.
   * Or you can pass down manual callback which will return another unique string.
   */
  uniqueSuffix(params: CacheRouteBucketParams<T>): string
  /** Which buckets to automatically set based on current request and response data. */
  buckets(params: CacheRouteBucketParams<T>): string[]
  /** Which buckets to immediately invalidate based on current request and response data.
   * usually it only one bucket, but can be multiple as well
   */
}

type CacheRouteOptionForInvalidateData<T extends TAcceptableGeneralDataCache> = {
  invalidate(params: CacheRouteInvalidateParams<T>): string[]
}

type BaseCacheRouteOptionsForCacheData = {
  /**
   * serializable means we store data in cache as `JSON`. Else we expect to store it as `Buffer`.
   * Use serializable = false, only if you know that `cache storage` stores data either as Buffer or as Buffer[].
   * @default true
   */
  serializable?: boolean
  /** Whether or not to enable cache for this route. Default: `true` for `HEAD` and `GET`, `false` otherwise. */
  enabled?: boolean
  /** Time in milliseconds to await for cache acquisition before processing regularly. */
  timeout?: number
  ttl?: number
}

export type CacheRouteOptions<T extends TAcceptableGeneralDataCache> =
  | (BaseCacheRouteOptionsForCacheData &
      (CacheRouteOptionBucketWithSame<T> | CacheRouteOptionBucketWithoutSame<T>))
  | CacheRouteOptionForInvalidateData<T>

export type CacheRouteOptionsGeneral<T extends TAcceptableGeneralDataCache> = Partial<
  BaseCacheRouteOptionsForCacheData &
    CacheRouteOptionBucketWithSame<T> &
    CacheRouteOptionForInvalidateData<T>
>

export type CacheRouteBucketParams<T extends TAcceptableGeneralDataCache> = {
  req: AppRequest
  data?: T
}

export type CacheRouteInvalidateParams<T extends TAcceptableGeneralDataCache> = Required<
  CacheRouteBucketParams<T>
>

export type CacheInterceptParams<T extends TAcceptableGeneralDataCache> =
  BaseCacheRouteOptionsForCacheData &
    CacheRouteOptionBucketWithSame<T> &
    CacheRouteOptionForInvalidateData<T>

export type MaybeCacheInterceptParams<T extends TAcceptableGeneralDataCache> =
  // Required options are options which we can define automatically for any request
  Required<Pick<CacheInterceptParams<T>, 'enabled' | 'timeout' | 'ttl' | 'serializable'>> &
    // Partial options are options which are not garanteed
    Partial<Pick<CacheInterceptParams<T>, 'buckets' | 'uniqueSuffix' | 'invalidate'>>

export type CacheOptions = {
  /** Enables gzip compression when storing cached data (Only for JSON (?)). */
  enableCompression?: boolean
  /** Default cache acquisition timeout in milliseconds when unspecified at controller. Default: 500ms. */
  defaultTimeout: number
  /** Default TTL in milliseconds when unspecified at controller. Default: 1m. */
  defaultTtl: number
  /** By default we store data in Redis as JSON */
  defaultSerializable: true
  /** Bucket TTL in milliseconds. Default: 1d. */
  bucketTtl: number
  /** Amount of failed read attempts to trigger a failure state. Default: 3. */
  failureThreshold?: number
  /** Duration of a failure state in milliseconds where all attempts to read cached data are ignored. Default: 5s. */
  failureTtl?: number
  /** Redis host to store cached data. Can be overridden by env `CACHE_HOST`. */
  host?: string
  /** Redis port to store cached data. Can be overridden by env `CACHE_PORT`. */
  port?: number
  /** Redis username to store cached data. Can be overridden by env `REDIS_USERNAME`. */
  username?: string
  /** Redis password to store cached data. Can be overridden by env `REDIS_PASSWORD`. */
  password?: string
}

export type TAcceptableBinaryDataCache = Buffer | Buffer[]

export type TAcceptableGeneralDataCache =
  | string
  | number
  | unknown[]
  | Record<string, unknown>
  | TAcceptableBinaryDataCache

export type CacheProvider = {
  get<T>(key: string): Promise<T | null>
  getBuffer(key: string): Promise<Buffer | null>
  getBuffers(setName: string): Promise<Buffer[] | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(
    key: string,
    value: string | number | Buffer | unknown[] | Record<string, unknown>,
    options?: CacheTtlOptions,
  ): Promise<void>
  del(key: string): void | Promise<void>
  flushdb(): Promise<void>
  sadd(key: string, value: string | string[], options?: CacheTtlOptions): Promise<void>
  smembers(key: string): string[] | Promise<string[]>
  // Get instance of Redis or another provider
  getClient(): any
}

export type TGetCacheOptions = {
  params: CacheGetParams
  timeout: number
  serializable: boolean
  uniqueSuffixCache: string
}
