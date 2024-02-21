/* eslint-disable no-console */
import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'

import { RedisModule, redisOptionBuilder } from '../redis'
import { CacheService } from './cache.service'
import { PromiseModule } from '../promise'
import { Environment } from '../app'

/**
 * `CacheService` is wrapper based on `RedisService`
 */
@Module({
  imports: [
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get(Environment.REDIS_HOST)}:${configService.get(Environment.REDIS_PORT)}`,
        options: redisOptionBuilder(),
      }),
    }),
  ],
})
export class CacheModule {
  static CACHE_SERVICE_TOKEN = 'CACHE_SERVICE_TOKEN'

  static register(): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: CacheModule.CACHE_SERVICE_TOKEN,
          useClass: CacheService,
        },
      ],
      exports: [CacheModule.CACHE_SERVICE_TOKEN],
    }
  }
}

/**
 * `CacheService` is wrapper based on `RedisService` and `PromiseService`
 */
@Module({
  imports: [
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get(Environment.REDIS_HOST)}:${configService.get(Environment.REDIS_PORT)}`,
        options: redisOptionBuilder(),
      }),
    }),
    PromiseModule,
  ],
})
export class CacheDisabledModule {
  static CACHE_SERVICE_TOKEN = 'CACHE_SERVICE_TOKEN'

  static register(): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: CacheModule.CACHE_SERVICE_TOKEN,
          useValue: null,
        },
      ],
      exports: [CacheModule.CACHE_SERVICE_TOKEN],
    }
  }
}
