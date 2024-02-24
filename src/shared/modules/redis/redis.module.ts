/* eslint-disable @typescript-eslint/no-shadow */

import type { DynamicModule, Provider, Type } from '@nestjs/common'
import { Module } from '@nestjs/common'

import type {
  RedisModuleAsyncOptions,
  RedisModuleOptions,
  RedisModuleOptionsFactory,
} from './redis.types'
import { RedisService } from './redis.service'
import { PromiseModule } from '../promise'
import { getRedisOptionsToken, getRedisConnectionToken, createRedisConnection } from './redis.utils'
import { RedLockInstance } from '../redlock'

@Module({
  imports: [PromiseModule],
  providers: [RedisService, RedLockInstance],
  exports: [RedisService, RedLockInstance],
})
/**
 * `RedisService` is wrapper based on ioredis and `PromiseService`
 */
export class RedisModule {
  public static forRoot(options: RedisModuleOptions, connection?: string): DynamicModule {
    const redisOptionsProvider: Provider = {
      // Just get unique string based on connection string
      provide: getRedisOptionsToken(connection),
      useValue: options,
    }

    const redisConnectionProvider: Provider = {
      // Just get unique string based on connection string
      provide: getRedisConnectionToken(connection),
      // Get configured Redis instance based on options
      useFactory() {
        return createRedisConnection(options)
      },
    }

    return {
      module: RedisModule,
      providers: [redisOptionsProvider, redisConnectionProvider],
      exports: [redisOptionsProvider, redisConnectionProvider],
    }
  }

  public static forRootAsync(options: RedisModuleAsyncOptions, connection?: string): DynamicModule {
    const redisConnectionProvider: Provider = {
      // Just get unique string based on connection string
      provide: getRedisConnectionToken(connection),
      useFactory(options: RedisModuleOptions) {
        return createRedisConnection(options)
      },
      inject: [getRedisOptionsToken(connection)],
    }

    return {
      module: RedisModule,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options, connection), redisConnectionProvider],
      exports: [redisConnectionProvider],
    }
  }

  /**
 * Usually createAsyncProviders = createAsyncOptionsProvider => createAsyncProviders(options, connection)
 equals providing `options: RedisModuleOptions` (from RedisModule.forRootAsync(useFactory returns this `options`)) under `getRedisOptionsToken(connection)`
*/
  public static createAsyncProviders(
    options: RedisModuleAsyncOptions,
    connection?: string,
  ): Provider[] {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options, connection)]
    }

    /**
     * Almost not used because usually we want to use useFactory in pair with forRootAsync
     */
    return [
      this.createAsyncOptionsProvider(options, connection),
      {
        provide: options.useClass as Type<RedisModuleOptionsFactory>,
        useClass: options.useClass as Type<RedisModuleOptionsFactory>,
      },
    ]
  }

  /**
   * Usually under `getRedisOptionsToken(connection)` we can get options: RedisModuleOptions (redis options)
   */
  public static createAsyncOptionsProvider(
    options: RedisModuleAsyncOptions,
    connection?: string,
  ): Provider {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    if (options.useFactory) {
      return {
        provide: getRedisOptionsToken(connection),
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: getRedisOptionsToken(connection),
      async useFactory(optionsFactory: RedisModuleOptionsFactory): Promise<RedisModuleOptions> {
        return await optionsFactory.createRedisModuleOptions()
      },
      inject: [(options.useClass || options.useExisting) as Type<RedisModuleOptionsFactory>],
    }
  }
}
