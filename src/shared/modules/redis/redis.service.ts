import { Injectable, InternalServerErrorException } from '@nestjs/common'
import Redis from 'ioredis'

import { v4 } from 'uuid'

import { windValueToArray } from '@shared/helpers/transformers'

import { PromiseService } from '../promise/promise.service'
import type { CacheProvider } from '../cache/cache.types'
import { InjectRedis } from './redis.decorators'
import type { RedisLockOptions, RedisSetOptions, RedisTtlOptions } from './redis.types'
import { InjectLogger, ILoggerService } from '../logger'

@Injectable()
export class RedisService implements CacheProvider {
  private defaultTtl = 10_000

  public constructor(
    @InjectRedis() private readonly redisClient: Redis,
    @InjectLogger(RedisService.name)
    readonly logger: ILoggerService,
    private readonly promiseService: PromiseService,
  ) {}

  public getClient(): Redis {
    return this.redisClient
  }

  /**
   * Expire target key after configured time in milliseconds.
   * @param key
   * @param ttl
   */
  public async expire(key: string, ttl: number): Promise<void> {
    this.logger.trace(`[Redis]: EXPIRE ${key} ${ttl}`)

    await this.getClient().expire(key, ttl / 1000)
  }

  /**
   * Reads given key and parse its value.
   * @param key
   */
  public async get<T>(key: string): Promise<T | null> {
    const value = await this.getClient().get(key)

    this.logger.trace(`[Redis]: GET ${key}`)

    return value ? JSON.parse(value) : value
  }

  /**
   * Reads given key as buffer.
   * @param key
   */
  public async getBuffer(key: string): Promise<Buffer | null> {
    this.logger.trace(`[Redis]: GET ${key}`)

    return await this.getClient().getBuffer(key)
  }

  /**
   * Return Buffer[] based on keys from Set
   * @param key
   */
  public async getBuffers(setName: string): Promise<Buffer[] | null> {
    // 1. Get all keys from this set
    const keys = await this.smembers(setName)

    this.logger.trace(`[Redis]: GET ${keys.length}: ${JSON.stringify(keys)}`)

    if (!keys.length) {
      return null
    }

    // 2. Get all buffers from these keys
    const buffers = await Promise.all(keys.map((key) => this.getBuffer(key) as Promise<Buffer>))

    if (!buffers.length) {
      return null
    }

    return buffers as Buffer[] | null
  }

  /**
   * Sets key with target data, stringifies it in order to preserve type information.
   * @param key
   * @param value
   * @param options
   */
  public async set<T>(
    key: string,
    value: string | number | Buffer | unknown[] | Record<string, unknown>,
    options: RedisSetOptions = {},
  ): Promise<T | undefined> {
    this.logger.trace(`[Redis]: SET ${key}`)

    options.ttl ??= this.defaultTtl

    const { skip, get, keepTtl, ttl } = options
    const data = Buffer.isBuffer(value) ? value : JSON.stringify(value)
    const extraParams: string[] = []

    if (skip === 'IF_EXIST') {
      extraParams.push('NX')
    } else if (skip === 'IF_NOT_EXIST') {
      extraParams.push('XX')
    }

    if (keepTtl) {
      extraParams.push('KEEPTTL')
    } else if (ttl) {
      extraParams.push('PX', ttl.toString())
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    await this.getClient().set(key, data, ...(extraParams as any))

    if (get) {
      return (await this.get(key)) as T
    }

    return undefined
  }

  /**
   * Deletes desired key.
   * @param key
   */
  public async del(key: string): Promise<void> {
    this.logger.trace(`[Redis]: DEL ${key}`)

    await this.getClient().del(key)
  }

  /**
   * Flush database.
   */
  public async flushdb(): Promise<void> {
    this.logger.trace('[Redis]: flush all database')

    await this.getClient().flushdb()
  }

  /**
   * Increments a key and return its current value.
   * If it does not exist create it with given ttl.
   * @param key
   * @param amount
   * @param options
   */
  public async incrbyfloat(
    key: string,
    amount: number = 1,
    options: RedisTtlOptions = {},
  ): Promise<number> {
    this.logger.trace(`[Redis]: INCRBYFLOAT ${key} ${amount >= 0 ? '+' : ''}${amount}`)

    options.ttl ??= this.defaultTtl

    const stringValue = await this.getClient().incrbyfloat(key, amount)
    const numberValue = Number.parseFloat(stringValue)

    if (numberValue === amount) {
      await this.expire(key, options.ttl)
    }

    return numberValue
  }

  /**
   * Reads all values from target set.
   * @param key
   */
  public async smembers(key: string): Promise<string[]> {
    this.logger.trace(`[Redis]: SMEMBERS ${key}`)

    return await this.getClient().smembers(key)
  }

  /**
   * Adds a value to target key set.
   * @param key
   * @param value
   * @param options
   */
  public async sadd(
    key: string,
    value: string | string[],
    options: RedisTtlOptions = {},
  ): Promise<void> {
    this.logger.trace(
      `[Redis]: SADD ${key} ${Array.isArray(value) ? JSON.stringify(value) : value}`,
    )

    options.ttl ??= this.defaultTtl

    const members = windValueToArray(value)
    const setLength = await this.getClient().sadd(key, ...members)

    if (setLength > 0) {
      await this.expire(key, options.ttl)
    }
  }

  /**
   * Implements distributed lock strategy based on NX option from SET,
   * as recommend by their documentation:
   * https://redis.io/docs/reference/patterns/distributed-locks/.
   * @param key
   * @param options
   */
  public async lock(key: string, options: RedisLockOptions = {}): Promise<void> {
    options.ttl ??= this.defaultTtl
    options.timeout ??= this.defaultTtl
    options.delay ??= 500

    const { ttl, delay, timeout, retries } = options
    const lockKey = `lock:${key}`
    const lockValue = v4()

    this.logger.trace(`[Redis]: LOCK lockKey: ${lockKey}, lockValue: ${lockValue}`)

    await this.promiseService.retryOnRejection({
      name: 'lock()',
      delay,
      retries,
      timeout,
      promise: async () => {
        const currentValue = await this.set(lockKey, lockValue, {
          ttl,
          get: true,
          skip: 'IF_EXIST',
        })

        if (currentValue !== lockValue) {
          throw new InternalServerErrorException({
            message: `Failed to lock key ${key}`,
            options,
          })
        }
      },
    })
  }

  /**
   * Removes the pseudo key used by lock.
   * @param key
   */
  public async unlock(key: string): Promise<void> {
    this.logger.trace(`[Redis]: UNLOCK ${key}`)

    return await this.del(`lock:${key}`)
  }
}
