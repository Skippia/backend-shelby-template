import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Type,
} from '@nestjs/common/interfaces'
import type { RedisOptions, ClusterOptions, ClusterNode } from 'ioredis'

/**
 * Module initialization
 */
export type RedisSingleOptions = {
  type: 'single'
  url?: string
  options?: RedisOptions
}

export type RedisClusterOptions = {
  type: 'cluster'
  nodes: ClusterNode[]
  options?: ClusterOptions
}

export type RedisModuleOptions = RedisSingleOptions | RedisClusterOptions

export type RedisModuleOptionsFactory = {
  createRedisModuleOptions(): Promise<RedisModuleOptions> | RedisModuleOptions
}

export type RedisModuleAsyncOptions = {
  inject?: (OptionalFactoryDependency | InjectionToken)[]
  useClass?: Type<RedisModuleOptionsFactory>
  useExisting?: Type<RedisModuleOptionsFactory>
  useFactory?(...args: unknown[]): Promise<RedisModuleOptions> | RedisModuleOptions
} & Pick<ModuleMetadata, 'imports'>

/**
 * Utility types for Redis itself
 */

export type RedisTtlOptions = {
  /** Key time to live in milliseconds. Default: Fallback to `defaultTtl`. */
  ttl?: number
}

export type RedisLockOptions = {
  /** Delay between each retry. Default: 500ms. */
  delay?: number
  /** Time in milliseconds to keep retrying. Default: Fallback to `defaultTtl`. */
  timeout?: number
  /** Maximum amount of retries. Default: Infinity. */
  retries?: number
} & RedisTtlOptions

export type RedisSetOptions = {
  /** Includes NX or XX option to Redis command. */
  skip?: 'IF_EXIST' | 'IF_NOT_EXIST'
  /** Includes GET to Redis command. */
  get?: boolean
  /** Includes KEEPTTL to Redis command. */
  keepTtl?: boolean
} & RedisTtlOptions
