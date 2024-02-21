/* eslint-disable @typescript-eslint/no-floating-promises */
import { v4 as uuidV4 } from 'uuid'

import { ConfigModule, ConfigService } from '@nestjs/config'

import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import Joi from 'joi'

import { RedisModule } from './redis.module'
import { RedisService } from './redis.service'

import { redisOptionBuilder } from './redis.utils'
import type { TEnvironment } from '../app'
import { Environment, EnvironmentMode, LogSeverity, LoggerTransport } from '../app'

import { WinstonLoggerModule } from '../logger'

describe('RedisService', () => {
  let redisService: RedisService
  const testObjectKey: string = uuidV4()
  const testBufferKey: string = uuidV4()
  const randomNumber = Math.random()
  const randomBuffer = Buffer.from(uuidV4(), 'utf8')

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: Joi.object<TEnvironment>({
            // General
            PORT: Joi.number().required(),
            HOSTNAME: Joi.string().required(),
            NODE_ENV: Joi.string()
              .valid(
                EnvironmentMode.DEVELOPMENT,
                EnvironmentMode.PRODUCTION,
                EnvironmentMode.TESTING,
              )
              .required(),
            // Logger
            TRANSPORT_LEVEL: Joi.string()
              .valid(
                LoggerTransport.LOGSTASH,
                LoggerTransport.FILE,
                LoggerTransport.ONLY_CONSOLE,
                LoggerTransport.NOTHING,
              )
              .required(),
            SILENT_FILTER_ERRORS: Joi.boolean().required(),
            MAXIMUM_LOG_LEVEL: Joi.string()
              .valid(
                LogSeverity.ERROR,
                LogSeverity.WARN,
                LogSeverity.INFO,
                LogSeverity.HTTP,
                LogSeverity.VERBOSE,
                LogSeverity.DEBUG,
                LogSeverity.TRACE,
              )
              .required(),
            // Databases
            DB_URI: Joi.string().required(),
            ELASTICSEARCH_NODE: Joi.string().required(),
            ELASTICSEARCH_USERNAME: Joi.string().required(),
            ELASTICSEARCH_PASSWORD: Joi.string().required(),
            // JWT
            RT_SECRET: Joi.string().required(),
            AT_SECRET: Joi.string().required(),
            // Email
            MAIL_HOST: Joi.string().required(),
            MAIL_USER: Joi.string().required(),
            MAIL_PORT: Joi.number().required(),
            MAIL_PASSWORD: Joi.string().required(),
            MAIL_FROM: Joi.string().required(),
            MAIL_TRANSPORT: Joi.string().required(),
            // Redis
            REDIS_HOST: Joi.string().required(),
            REDIS_PORT: Joi.number().required(),
          }),
          //   ignoreEnvFile: process.env.NODE_ENV === EnvironmentMode.PRODUCTION,
          //   envFilePath: './environments/.env.test',
        }),
        WinstonLoggerModule.register(),
        RedisModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'single',
            url: `redis://${configService.get(Environment.REDIS_HOST)}:${configService.get(Environment.REDIS_PORT)}`,
            options: redisOptionBuilder(),
          }),
        }),
      ],
    }).compile()

    redisService = await app.resolve(RedisService)
    await redisService.flushdb()
  })

  afterAll(async () => {
    await redisService.flushdb()
  })

  describe('set', () => {
    it('should obey skip if not exist rule', async () => {
      await redisService.set(testObjectKey, { rng: randomNumber }, { skip: 'IF_NOT_EXIST' })
      const storedNumber = await redisService.get(testObjectKey)
      expect(storedNumber).toBeNull()
    })

    it('should persist a random number', async () => {
      expect(await redisService.set(testObjectKey, { rng: randomNumber })).toBeUndefined()
    })

    it('should persist a random buffer', async () => {
      expect(await redisService.set(testBufferKey, randomBuffer)).toBeUndefined()
    })

    it('should obey skip if exist rule', async () => {
      await redisService.set(testObjectKey, Math.random(), { skip: 'IF_EXIST' })
      const storedNumber = await redisService.get(testObjectKey)
      expect(storedNumber).toMatchObject({ rng: randomNumber })
    })
  })

  describe('get', () => {
    it('should read persisted random number', async () => {
      const storedNumber = await redisService.get(testObjectKey)
      expect(storedNumber).toMatchObject({ rng: randomNumber })
    })

    it('should read persisted random buffer', async () => {
      const storedBuffer = await redisService.getBuffer(testBufferKey)
      expect(storedBuffer).toEqual(randomBuffer)
    })
  })

  describe('del', () => {
    it('should delete persisted random number', async () => {
      await redisService.del(testObjectKey)
      const testValue = await redisService.get(testObjectKey)
      expect(testValue).toBeNull()
    })
  })

  describe('incrbyfloat', () => {
    it('should increment a key by integer amount', async () => {
      const incrementKey: string = uuidV4()
      const interactions = Math.floor(Math.random() * (100 - 50 + 1)) + 50
      const incrementAmount = 1

      for (let i = 0; i < interactions; i++) {
        redisService.incrbyfloat(incrementKey, incrementAmount)
      }

      const testValue = await redisService.get(incrementKey)
      expect(testValue).toBe(interactions * incrementAmount)
    })

    it('should increment a key by float amount', async () => {
      const incrementKey: string = uuidV4()
      const scale = 12
      const interactions = Math.floor(Math.random() * (100 - 50 + 1)) + 50
      const incrementAmount = Number.parseFloat(Math.random().toFixed(scale))

      for (let i = 0; i < interactions; i++) {
        redisService.incrbyfloat(incrementKey, incrementAmount)
      }

      const testValue: number = (await redisService.get(incrementKey)) as number
      expect(testValue.toFixed(scale)).toBe((interactions * incrementAmount).toFixed(scale))
    })

    it('should increment a key without resetting ttl', async () => {
      const incrementKey: string = uuidV4()

      for (let i = 0; i < 10; i++) {
        redisService.incrbyfloat(incrementKey, 1, { ttl: 2000 })
        await new Promise((resolve) => {
          setTimeout(resolve, 100)
        })
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 1100)
      })

      const testValue = await redisService.get(incrementKey)
      expect(testValue).toBeNull()
    })

    it('should decrement a key if input is negative', async () => {
      const incrementKey: string = uuidV4()

      await redisService.incrbyfloat(incrementKey, 10)
      await redisService.incrbyfloat(incrementKey, -3)

      const testValue = await redisService.get(incrementKey)
      expect(testValue).toBe(7)
    })
  })

  describe('lock', () => {
    it('should disallow locking the same key at the same time', async () => {
      const lockKey: string = uuidV4()
      const start = Date.now()
      const ttl = 500
      const instances = 5
      const lockPromises = [] as Promise<void>[]

      for (let i = 0; i < instances; i++) {
        lockPromises.push(redisService.lock(lockKey, { ttl }))
      }

      await Promise.all(lockPromises)

      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThan(ttl * (instances - 1))
    })

    it('should allow locking the same key if it has been unlocked', async () => {
      const lockKey: string = uuidV4()
      const start = Date.now()
      const ttl = 5000

      await redisService.lock(lockKey, { ttl })
      await redisService.unlock(lockKey)
      await redisService.lock(lockKey, { ttl })

      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(ttl)
    })

    it('should try once and throw if retries are zero', async () => {
      const lockKey: string = uuidV4()
      const ttl = 1000
      let exception: boolean

      await redisService.lock(lockKey, { ttl })

      try {
        await redisService.lock(lockKey, {
          retries: 0,
          delay: ttl * 2,
          ttl,
        })
      } catch {
        exception = true
      }

      // @ts-expect-error ...
      expect(exception).toBeTruthy()
    })
  })
})
