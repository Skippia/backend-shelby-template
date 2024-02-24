import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Client from 'ioredis'
import Redlock from 'redlock'

import { Environment } from '../app'

@Injectable()
export class RedLockInstance {
  public instance: Redlock
  constructor(private readonly configService: ConfigService) {
    const redisConnection = new Client({
      host: configService.get(Environment.REDIS_HOST),
      port: configService.get(Environment.REDIS_PORT),
    })

    this.instance = new Redlock([redisConnection], {
      /**
       * This option specifies the amount of time in milliseconds that Redlock
       * will add to the lock's expiration time to account for clock drift between
       * the client and the Redis nodes.
       * The default value is 0.01, which means that Redlock will add 1% of the lock's
       * expiration time to the actual expiration time.
       */
      driftFactor: 0.01, // time in ms
      /**
       * This option specifies the maximum number of times that Redlock
       * will retry acquiring the lock if it fails to do so. The default value is 10.
       */
      retryCount: 20,
      /**
       * This option specifies the amount of time in milliseconds that Redlock
       * will wait before retrying to acquire the lock. The default value is 200.
       */
      retryDelay: 200, // time in ms
      /**
       * This option specifies the amount of random delay that Redlock will add
       * to the retry delay to avoid synchronized retries by multiple clients. The default value is 200.
       */
      retryJitter: 200, // time in ms
      /**
       * This option specifies the amount of time in milliseconds that Redlock will automatically
       * extend the lock's expiration time if the client is still holding the lock.
       * The default value is 500. This is useful to prevent the lock
       * from expiring while the client is still using it.
       */
      automaticExtensionThreshold: 500,
    })
  }
}
