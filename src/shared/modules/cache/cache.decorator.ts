import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common'

import { CacheReflector } from './cache.enum'
import { CacheInterceptor } from './cache.interceptor'
import type { CacheRouteOptions, TAcceptableGeneralDataCache } from './cache.types'

/**
 * Enables inbound caching for target method.
 * @param options
 */
export function Cache<T extends TAcceptableGeneralDataCache>(
  options: CacheRouteOptions<T>,
): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(CacheReflector.CACHE_OPTIONS, options),
    UseInterceptors(CacheInterceptor),
  )
}
