/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Observable } from 'rxjs'
import { mergeMap, of } from 'rxjs'

import { windValueToArray } from '@shared/helpers/transformers'

import { CacheReflector, CacheStatus } from './cache.enum'
import type {
  CacheSetParams,
  CacheGetParams,
  MaybeCacheInterceptParams,
  CacheRouteOptionsGeneral,
  CacheRouteOptionBucketWithSame,
  TAcceptableGeneralDataCache,
  CacheRouteOptionBucketWithoutSame,
} from './cache.types'
import { CacheService } from './cache.service'
import { CacheModule } from './cache.module'
import type { AppRequest } from '../app'
import { AppOptions } from '../app'
import { ILoggerService, InjectLogger } from '../logger'
import { ContextService } from '../context'

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  public constructor(
    @Inject('APP_CONFIG') private readonly appOptions: AppOptions,
    @Inject(CacheModule.CACHE_SERVICE_TOKEN) private readonly cacheService: CacheService,
    private readonly contextService: ContextService,
    @InjectLogger(CacheInterceptor.name)
    readonly logger: ILoggerService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Attempt to acquire cached data, if present, resolve with it
   * before proceeding to controller.
   *
   * If not, acquire data from controller and then persist it.
   * @param context
   * @param next
   */
  public async intercept<T extends TAcceptableGeneralDataCache>(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req: AppRequest = this.contextService.getRequest()

    let cacheGetParams: null | CacheGetParams = null
    let cacheSetParams: CacheSetParams | null
    let uniqueSuffixCache: string | null = null
    let cache: unknown

    /**
     * Override uninitialized options with default ones
     */
    const maybeCacheParams: MaybeCacheInterceptParams<T> =
      this.buildMaybeCacheInterceptParams(context)

    const { enabled, timeout, ttl, serializable } = maybeCacheParams

    /**
     * If cache is enabled for this endpoint - try to return data from cache
     */
    if (enabled) {
      this.logger.trace('[Cache]: cache is enabled')
      cacheGetParams = this.buildAlwaysGetCacheInterceptParams()
      cacheSetParams = {
        ...cacheGetParams,
        timeout,
        ttl,
      }

      /**
       * Get options from reflector in @Cache decorator.
       * They must exist because we are inside `enabled = true`.
       * `enabled` can be `true` only if `invalidate callback` is not defined.
       * If `invalidate callback` is not defined that implies we set `buckets` and `uniqueSuffix` callbacks.
       */
      const { buckets, uniqueSuffix } = this.buildSpecificGetCacheInterceptParams(context)

      /**
       * We can do type assertion as `(params: CacheRouteBucketParams) => string`,
       * because `same` can be only if bucket function returns `string`
       */
      uniqueSuffixCache =
        uniqueSuffix === 'same'
          ? (buckets({ req }) as ReturnType<CacheRouteOptionBucketWithSame<T>['buckets']>)
          : uniqueSuffix({ req })

      try {
        cache = await this.cacheService.getCache({
          params: cacheGetParams,
          timeout,
          serializable,
          uniqueSuffixCache,
        })
      } catch (e) {
        this.logger.warn(`Failed to acquire inbound cached data', ${JSON.stringify(e)}`)
      }

      if (cache) {
        this.logger.trace('[Cache]: Hit cache from')
        this.contextService.setCacheStatus(CacheStatus.HIT)
        return of(cache)
      }
    }

    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/require-await
      mergeMap(async (data: T) =>
        this.handleOutputData(req, data, maybeCacheParams, cacheSetParams, uniqueSuffixCache),
      ),
    )
  }
  /**
   * Given output data, decided whether or not it should be cached,
   * as well as apply any related buckets.
   * @param req - Express request object
   * @param data - data which will be cached (it returns controller)
   * @param maybeCacheParams - garanteed cache options (`enabled`, `timeout`, `ttl`, `serializable`)
   * and not garanteed ((`buckets`, `uniquePrefix`) - only for caching requests (if enabled = true))
   * and (`invalidate` - for invalidating requests))
   * @param cacheSetParams - only if enabled is true (we want to cache this request) - hostname, query, method, path
   * @param uniqueSuffixCache - only if enabled is true (we want to cache this request)
   */

  private handleOutputData<T extends TAcceptableGeneralDataCache>(
    req: AppRequest,
    data: T,
    maybeCacheParams: MaybeCacheInterceptParams<T>,
    cacheSetParams: CacheSetParams | null,
    uniqueSuffixCache: string | null,
  ): unknown {
    const { enabled, serializable, invalidate, buckets } = maybeCacheParams

    /**
     * Entirely delete bucket(s) and all data which can be found by keys are stored inside this bucket(s)
     */
    if (invalidate) {
      this.logger.trace('[Cache]: try to invalidate')

      if (serializable) {
        this.cacheService.invalidateBuckets(invalidate({ req, data }))
      } else {
        this.cacheService.invalidateBucketsWithBuffers(invalidate({ req, data }))
      }
      return data
    }

    /**
     * We dont want to cache data - just return response from DB as-is
     */
    if (!enabled) {
      this.logger.trace('[Cache]: cache is disabled')
      return data
    }

    /**
     * We want to cache data and it's not cached yet
     */
    this.contextService.setCacheStatus(CacheStatus.MISS)

    let bucketValues: string[] | undefined

    /**
     * We can do type assertion here because enabled = true
     */
    const { ttl } = cacheSetParams as CacheSetParams
    const dataKey = this.cacheService.buildCacheDataKey(
      cacheSetParams as CacheSetParams,
      uniqueSuffixCache as string,
    )

    if (buckets) {
      const _bucketValueOrValues = buckets({ req, data })
      bucketValues = windValueToArray(_bucketValueOrValues)
      bucketValues = bucketValues.length > 0 ? bucketValues : undefined
    }

    /**
     * Maybe save keys in Bucket(s) and save all data as Buffer
     */
    if (!serializable) {
      this.tryToSaveAsBuffer(data, dataKey, ttl, bucketValues)
      return data
    }

    /**
     * Maybe save keys in Bucket(s) and save all data as JSON (cause serializable = true)
     */
    if (bucketValues) {
      this.cacheService.setBuckets(bucketValues, dataKey)
    }

    this.cacheService.setCache(
      data as string | number | Buffer | unknown[] | Record<string, unknown>,
      dataKey,
      ttl,
    )

    return data
  }

  private tryToSaveAsBuffer(
    data: string | number | Buffer | Buffer[] | unknown[] | Record<string, unknown>,
    dataKey: string,
    ttl: number,
    bucketValues?: string[],
  ): void {
    this.logger.trace('[Cache]: try to save as buffer')

    // 1. We need to prevent saving not Buffer data as Buffer - check it (f.e endpoint can return just null, undefined or any not Buffer result)
    const isSomeElNotBuffer = windValueToArray(data).some((el) => !Buffer.isBuffer(el))

    // 2. Cancel saving in cache not Buffer result
    if (isSomeElNotBuffer) {
      this.logger.warn('[Cache]: Some element is not Buffer!')
      return
    }

    if (bucketValues) {
      this.cacheService.setBuckets(bucketValues, dataKey)
    }

    this.cacheService.setCacheForArrayOfBuffers(data as Buffer | Buffer[], dataKey, ttl)
  }

  /**
   * Build cache interception params by merging route options with
   * application level.
   * @param context
   */
  private buildMaybeCacheInterceptParams<T extends TAcceptableGeneralDataCache>(
    context: ExecutionContext,
  ): MaybeCacheInterceptParams<T> {
    const method = this.contextService.getRequestMethod()

    /**
     * Get cache options from @Cache decorator in controller.
     * We use here `CacheRouteOptionsGeneral` type because currently we lack of information
     */
    const options: CacheRouteOptionsGeneral<T> = this.reflector.get(
      CacheReflector.CACHE_OPTIONS,
      context.getHandler(),
    )

    const {
      enabled: routeEnabled,
      timeout: routeTimeout,
      ttl: routeTtl,
      serializable: routeSerializable,
      invalidate,
      buckets,
      uniqueSuffix,
    } = options

    /**
     * If we haven't gotten options from @Cache in controller, use
     * default options (all except bucket and invalidate callbacks)
     */
    // If we have invalidate callback, that implies we don't want to cache data and we have pair of bucket and uniqueSuffix callbacks ()
    const enabled = invalidate ? false : routeEnabled ?? ['GET', 'HEAD'].includes(method as string)
    const timeout = routeTimeout || this.appOptions.cache?.defaultTimeout || 0
    const ttl = routeTtl || (this.appOptions.cache?.defaultTtl as number)
    const serializable =
      routeSerializable ?? (this.appOptions.cache?.defaultSerializable as boolean)

    return {
      enabled,
      timeout,
      ttl,
      serializable,
      invalidate,
      buckets,
      uniqueSuffix,
    }
  }

  private buildAlwaysGetCacheInterceptParams(): CacheGetParams {
    const req: AppRequest = this.contextService.getRequest()

    const { method, path, hostname, query } = req

    return { method, path, hostname, query }
  }

  private buildSpecificGetCacheInterceptParams<T extends TAcceptableGeneralDataCache>(
    context: ExecutionContext,
  ): CacheRouteOptionBucketWithSame<T> | CacheRouteOptionBucketWithoutSame<T> {
    /**
     * Get cache options from @Cache decorator in controller.
     * We use here `CacheRouteOptionsGeneral` type because currently we lack of information
     */
    const options: CacheRouteOptionsGeneral<T> = this.reflector.get(
      CacheReflector.CACHE_OPTIONS,
      context.getHandler(),
    )

    const { buckets, uniqueSuffix } = options

    return { buckets, uniqueSuffix } as
      | CacheRouteOptionBucketWithSame<T>
      | CacheRouteOptionBucketWithoutSame<T>
  }
}
