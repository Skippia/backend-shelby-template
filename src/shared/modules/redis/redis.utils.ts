/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { Cluster, RedisOptions } from 'ioredis'
import Redis from 'ioredis'

import type { RedisModuleOptions } from './redis.types'
import {
  REDIS_MODULE_CONNECTION,
  REDIS_MODULE_CONNECTION_TOKEN,
  REDIS_MODULE_OPTIONS_TOKEN,
} from './redis.constants'

export function getRedisOptionsToken(connection?: string): string {
  return `${connection || REDIS_MODULE_CONNECTION}_${REDIS_MODULE_OPTIONS_TOKEN}`
}

export function getRedisConnectionToken(connection?: string): string {
  return `${connection || REDIS_MODULE_CONNECTION}_${REDIS_MODULE_CONNECTION_TOKEN}`
}

export async function createRedisConnection(options: RedisModuleOptions): Promise<Redis | Cluster> {
  const { type, options: commonOptions = {} } = options

  if (type === 'cluster') {
    return new Redis.Cluster(options.nodes, commonOptions)
  } else if (type === 'single') {
    const { url, options: { port, host } = {} } = options

    const connectionOptions: RedisOptions = { ...commonOptions, port, host }

    const redis = url ? new Redis(url, connectionOptions) : new Redis(connectionOptions)

    redis
      .on('error', (err) => {
        console.log('Redis Client Error: ', err)
      })
      .on('connect', () => {
        console.log('Redis Client Connected')
      })
      .on('ready', () => {
        console.log('Redis Client Ready')
      })
      .on('reconnecting', () => {
        console.log('Redis Client Reconnecting')
      })
      .on('end', () => {
        console.log('Redis Client End')
      })

    await redis.connect()

    return redis
  }

  throw new Error('Invalid configuration')
}

export function redisOptionBuilder(options?: RedisOptions): RedisOptions {
  const defaultOptions: RedisOptions = {
    enableAutoPipelining: true,
    lazyConnect: true,
    keepAlive: 1000,
    retryStrategy: (times: number): number => {
      const retryDelay = Math.min(times * 1000, 60_000)

      if (times > 2) {
        // eslint-disable-next-line no-console
        console.error('Redis connection failed', { retryDelay })
      }

      return retryDelay
    },
    reconnectOnError: (err: Error): boolean | 1 | 2 => {
      // eslint-disable-next-line no-console
      console.error(err.message, err)
      return 2
    },
  }
  return {
    ...defaultOptions,
    ...options,
  }
}
