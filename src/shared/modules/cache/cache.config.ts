import type { CacheOptions } from './cache.types'

export const CACHE_DEFAULT_OPTIONS: CacheOptions = {
  defaultTimeout: 500,
  defaultTtl: 60_000,
  bucketTtl: 60_000,
  failureThreshold: 3,
  failureTtl: 5000,
  enableCompression: false,
  defaultSerializable: true,
}
