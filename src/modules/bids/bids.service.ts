/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common'

import type Redis from 'ioredis'

import { CacheModule, CacheService } from '@shared/modules/cache'

import type { RedisService } from '@shared/modules/redis'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import { generateItemKey } from './bids.types'
import type { TCreateBid, TItem } from './bids.types'

@Injectable()
export class BidService {
  constructor(
    @Inject(CacheModule.CACHE_SERVICE_TOKEN) private readonly cacheService: CacheService,
    @InjectLogger(BidService.name)
    readonly logger: ILoggerService,
  ) {}

  /**
   * No locking
   */
  async createBidWithoutLock(newBid: TCreateBid): Promise<TItem> {
    const redisService = this.cacheService.getProvider() as RedisService

    const item = await this.getItemById(newBid.itemId)

    if (!item) {
      throw new Error('Item does not exist')
    }

    if (item.price >= newBid.price) {
      throw new Error(`Bid = ${newBid.price} too low (less than ${item.price})`)
    }

    if (Number(new Date()) - Number(item.endingAt) < 0) {
      throw new Error('Item closed to bidding')
    }

    const updatedItem: TItem = {
      ...item,
      bids: item.bids + 1,
      price: newBid.price,
      highestBidUserId: newBid.userId,
    }

    /**
     * It can be improved via instead of using set + JSON.stringify -> hset + updated keys
     */
    await redisService.set(generateItemKey(newBid.itemId), updatedItem)

    return updatedItem
  }

  /**
   * Based on custom lock & unlock
   */
  async createBidWithCustomLock(newBid: TCreateBid): Promise<TItem> {
    const redisService = this.cacheService.getProvider() as RedisService

    // 1. Lock resourse
    await redisService.customLock(generateItemKey(newBid.itemId), { ttl: 500, timeout: 5000 })

    this.logger.debug(`bid with price = ${newBid.price} entered in the critical section`)

    const item = await this.getItemById(newBid.itemId)

    if (!item) {
      throw new Error('Item does not exist')
    }

    if (item.price >= newBid.price) {
      throw new Error(`Bid = ${newBid.price} too low (less than ${item.price})`)
    }

    if (Number(new Date()) - Number(item.endingAt) < 0) {
      throw new Error('Item closed to bidding')
    }

    const updatedItem: TItem = {
      ...item,
      bids: item.bids + 1,
      price: newBid.price,
      highestBidUserId: newBid.userId,
    }

    /**
     * It can be improved via instead of using set + JSON.stringify -> hset + updated keys
     */
    await redisService.set(generateItemKey(newBid.itemId), updatedItem)

    // 2. Unlock resourse
    await redisService.customUnlock(generateItemKey(newBid.itemId))

    this.logger.debug(`bid with price = ${newBid.price} exited from the critical section`)

    return updatedItem
  }

  /**
   * Based on distributed lock (Redlock)
   */
  async createBidWithRedlock(newBid: TCreateBid): Promise<TItem> {
    const redisService = this.cacheService.getProvider() as RedisService

    // 1. Lock resourse
    const lock = await redisService.redlockLock(generateItemKey(newBid.itemId), 500)

    this.logger.debug(`bid with price = ${newBid.price} entered in the critical section`)

    const item = await this.getItemById(newBid.itemId)

    if (!item) {
      throw new Error('Item does not exist')
    }

    if (item.price >= newBid.price) {
      throw new Error(`Bid = ${newBid.price} too low (less than ${item.price})`)
    }

    if (Number(new Date()) - Number(item.endingAt) < 0) {
      throw new Error('Item closed to bidding')
    }

    const updatedItem: TItem = {
      ...item,
      bids: item.bids + 1,
      price: newBid.price,
      highestBidUserId: newBid.userId,
    }

    /**
     * It can be improved via instead of using set + JSON.stringify -> hset + updated keys
     */
    await redisService.set(generateItemKey(newBid.itemId), updatedItem)

    // 2. Unlock resourse
    await lock.release()

    this.logger.debug(`bid with price = ${newBid.price} exited from the critical section`)

    return updatedItem
  }

  /**
   * Based on watch + transaction.
   * It doesn't work because it seems (?) that `ioredis` doesn't have an api (unlike of `redis`)
   * => i can't implement watch + isolatedExecution
   * https://github.com/redis/node-redis/blob/master/docs/isolated-execution.md
   */
  async createBidWithWatchTransaction(newBid: TCreateBid): Promise<TItem> {
    const redis = this.cacheService.getProvider().getClient() as Redis

    // 1. Start transaction
    await redis.watch(generateItemKey(newBid.itemId))

    const item = await this.getItemById(newBid.itemId)

    if (!item) {
      throw new Error('Item does not exist')
    }

    if (item.price >= newBid.price) {
      throw new Error('Bid too low')
    }

    if (Number(new Date()) - Number(item.endingAt) < 0) {
      throw new Error('Item closed to bidding')
    }

    const updatedItem: TItem = {
      ...item,
      bids: item.bids + 1,
      price: newBid.price,
      highestBidUserId: newBid.userId,
    }

    /**
     * It can be improved via instead of using set + JSON.stringify -> hset + updated keys
     */
    // 2. End transaction
    const transactionResult = await redis
      .multi()
      .set(generateItemKey(newBid.itemId), JSON.stringify(updatedItem))
      .exec()

    return updatedItem
  }

  async getItemById(itemId: string): Promise<TItem | null> {
    return await this.cacheService.getProvider().get<TItem>(generateItemKey(itemId))
  }
}
