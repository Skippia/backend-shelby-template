/* eslint-disable @typescript-eslint/no-shadow */
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'

import type { App } from 'supertest/types'
import { initApp } from 'test/helpers/common'

import { createItems } from 'test/helpers/create'

import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'
import { CacheModule } from '@shared/modules/cache'
import type { CacheService } from '@shared/modules/cache'

import { BidsModule } from './bids.module'
import { findMaxPriceBid, mockMakeBids1, mockMakeBidsSet } from './bids.mock'
import { generateItemKey } from './bids.types'
import type { TItem } from './bids.types'

/**
 * 1. Make 5 bids simultaneously without transaction
 * 2. Make 5 bids simultaneously with transaction
 * 3. Make 5 bids simultaneously with locking
 * 4. Make 5 bids simultaneously with Watch + Transaction (doesn't work)
 */
describe('Bids endpoints (e2e)', () => {
  let app: INestApplication
  let cache: CacheService
  let itemId: string

  const _GP = APP_DEFAULT_OPTIONS.globalPrefix

  async function runInitDataMigration(cache: CacheService): Promise<Pick<TItem, 'id'>> {
    return await createItems(cache)
  }

  beforeAll(async () => {
    app = await initApp({
      imports: [BidsModule],
      disableOptions: {
        disableCache: false,
      },
    })

    cache = app.get<CacheService>(CacheModule.CACHE_SERVICE_TOKEN)
  })

  beforeEach(async () => {
    await cache.getProvider().flushdb()
    itemId = (await runInitDataMigration(cache)).id
  })

  afterAll(async () => {
    await app.close()
  })

  afterEach(async () => {
    await cache.getProvider().flushdb()
  })

  /** 1. Make 5 bids simultaneously without locking resourse */
  describe(`[ POST ${_GP}/bids/make-no-lock ]`, () => {
    it('Make 5 bids simultaneously without locking resourse', async () => {
      const results = await Promise.all(
        mockMakeBids1.map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make-no-lock`)
            .send(bid),
        ),
      )

      results.forEach((res) => {
        /**
         * All status 200, what can't be true
         * because each following bid less than the previous one (can be only 1 successfull operation)
         */
        expect(res.status).toBe(200)
      })
    })
  })

  /** 2. Make 5 bids simultaneously with custom locking */
  describe(`[ POST ${_GP}/bids/make1 ]`, () => {
    it('Make 5 bids simultaneously with custom locking 1', async () => {
      const results = await Promise.all(
        mockMakeBidsSet[0].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make1`)
            .send(bid),
        ),
      )

      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))
      const amountOfFailures = results.filter((res) => res.status === 500).length

      expect(amountOfFailures).toBe(0)
      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with custom locking 2', async () => {
      const results = await Promise.all(
        mockMakeBidsSet[1].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make1`)
            .send(bid),
        ),
      )

      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))
      const amountOfFailures = results.filter((res) => res.status === 500).length

      /**
       * That's mean we have only one successful bid
       * because each following bid less than the previous one and can be made
       */
      expect(amountOfFailures).toBe(4)
      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with custom locking 3', async () => {
      const results = await Promise.all(
        mockMakeBidsSet[2].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make1`)
            .send(bid),
        ),
      )
      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))
      const amountOfFailures = results.filter((res) => res.status === 500).length

      /**
       * That's mean we have only one successful bid
       * because each following bid less than the previous one and can be made
       */
      expect(amountOfFailures).toBe(2)
      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with custom locking 4', async () => {
      const results = await Promise.all(
        mockMakeBidsSet[3].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make1`)
            .send(bid),
        ),
      )
      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))
      const amountOfFailures = results.filter((res) => res.status === 500).length

      expect(amountOfFailures).toBe(1)
      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with custom locking 5', async () => {
      const results = await Promise.all(
        mockMakeBidsSet[4].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make1`)
            .send(bid),
        ),
      )
      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))
      const amountOfFailures = results.filter((res) => res.status === 500).length

      expect(amountOfFailures).toBe(2)
      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })
  })

  /** 3. Make 5 bids simultaneously with Redlock locking */
  describe(`[ POST ${_GP}/bids/make2 ]`, () => {
    it('Make 5 bids simultaneously with Redlock locking 1', async () => {
      await Promise.all(
        mockMakeBidsSet[0].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make2`)
            .send(bid),
        ),
      )

      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))

      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with Redlock locking 2', async () => {
      const results = await Promise.all(
        mockMakeBidsSet[1].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make2`)
            .send(bid),
        ),
      )

      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))

      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with Redlock locking 3', async () => {
      await Promise.all(
        mockMakeBidsSet[2].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make2`)
            .send(bid),
        ),
      )

      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))

      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with Redlock locking 4', async () => {
      await Promise.all(
        mockMakeBidsSet[3].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make2`)
            .send(bid),
        ),
      )

      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))

      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })

    it('Make 5 bids simultaneously with Redlock locking 5', async () => {
      await Promise.all(
        mockMakeBidsSet[4].map((bid) =>
          request(app.getHttpServer() as App)
            .post(`/${_GP}/bids/make2`)
            .send(bid),
        ),
      )

      const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))

      expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
    })
  })

  /** 4. Make 5 bids simultaneously with Watch + Transaction */
  /**
   * ! It doesn't work
   */
  //   describe(`[ POST ${_GP}/bids/make-watch-transaction ]`, () => {
  //     it('Make 5 bids simultaneously with Watch + Transaction 2', async () => {
  //       await Promise.all(
  //         mockMakeBidsSet[1].map((bid) =>
  //           request(app.getHttpServer() as App)
  //             .post(`/${_GP}/bids/make-watch-transaction`)
  //             .send(bid),
  //         ),
  //       )

  //       const updatedItem = await cache.getProvider().get<TItem>(generateItemKey(itemId))

  //       /**
  //        * That's mean we have only one successful bid
  //        * because each following bid less than the previous one and can be made
  //        */
  //       expect(updatedItem?.price).toBe(findMaxPriceBid(mockMakeBids1).price)
  //     })
  //   })
})
