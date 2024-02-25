/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  DynamicModule,
  INestApplication,
  MiddlewareConsumer,
  ModuleMetadata,
} from '@nestjs/common'
import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, NestFactory } from '@nestjs/core'

import RedisStore from 'connect-redis'
import session from 'express-session'

import fg from 'fast-glob'

import cookieParser from 'cookie-parser'

import { ConfigModule, ConfigService } from '@nestjs/config'

import Joi from 'joi'

import { ServeStaticModule } from '@nestjs/serve-static'

import { AccessControlModule } from 'nest-access-control'

import path from 'path'

import type { ExpressAdapter } from '@nestjs/platform-express'

import { v4 as uuidv4 } from 'uuid'

import { json, urlencoded } from 'express'

import passport from 'passport'

import type { Redis } from 'ioredis'

import { AllExceptionFilter } from '@shared/filters'

import { LoggingInterceptor } from '@shared/modules/logger'

import { PerformanceInterceptor } from '@shared/interceptors'

import { initSwagger } from '@shared/swagger'

import { RBAC_POLICY } from '@shared/rbac'

import { CacheDisabledModule, CacheModule } from '@shared/modules/cache'

import { CacheBucketModule } from '@shared/modules/cache-bucket/cache-bucket.module'

import { AppService } from './app.service'
import type { AppOptions, AppRequest, AppResponse } from './app.types'
import { APP_DEFAULT_OPTIONS, buildCorsOption } from './app.config'
import { AppController } from './app.controller'
import type { TEnvironment } from './app.enum'
import { Environment, EnvironmentMode, LogSeverity } from './app.enum'
import { WinstonLoggerModule } from '../logger'
import { PromiseModule } from '../promise'
import type { TManualTelemertrySpan } from '../context'
import { ContextModule, ContextStorageKey } from '../context'
import { ContextStorage } from '../context/context.storage'
import { getRedisConnectionToken } from '../redis'

// TODO: improve prisma models
@Global()
@Module({})
export class AppModule {
  private static instance: INestApplication | undefined
  private static options: AppOptions

  /**
   * Given a glob path string, find all matching files
   * and return an array of their exports.
   *
   * If there is a mix of sources and maps, keep only
   * the JavaScript version.
   * @param _globPath
   * @param root
   */
  public static globRequire(_globPath: string | string[], root?: string): any[] {
    const globPath = Array.isArray(_globPath) ? _globPath : [_globPath]
    const cwd = root || process.cwd()

    const matchingFiles = fg.sync(globPath, { cwd })
    const jsFiles = matchingFiles.filter((file) => file.match(/\.js$/g))
    const normalizedFiles = jsFiles.length > 0 ? jsFiles : matchingFiles

    const exportsArrays = normalizedFiles.map((file) => {
      // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
      const exportsObject: unknown[] = require(`${cwd}/${file}`)
      return Object.keys(exportsObject).map((key) => exportsObject[key])
    })

    return exportsArrays.flat()
  }

  /**
   * Returns application instance.
   */
  public static getInstance(): INestApplication {
    if (!this.instance) {
      throw new Error('application instance not configured')
    }

    return this.instance
  }

  /**
   * Closes application instance.
   */
  public static async close(): Promise<void> {
    await this.instance?.close()
    this.instance = undefined
  }

  /**
   * Boots an instance of a Nest Application and listen
   * on desired port and hostname.
   *
   * Skips the compile step if a pre-compiled `instance` is provided.
   * @param options
   */
  public static async bootstrap(options: AppOptions = {}): Promise<INestApplication> {
    const { app } = options

    if (app) {
      this.instance = app
    } else {
      await this.compile(options)
    }

    await this.listen()

    return this.instance as INestApplication
  }

  /**
   * Builds and configures an instance of a Nest Application, returning
   * its reference without starting the adapter.
   * @param options
   */
  public static async compile(options: AppOptions = {}): Promise<INestApplication> {
    this.configureOptions(options)

    await this.configureAdapter()

    if (!this.options.disableDocs) {
      await initSwagger(this.getInstance())
    }

    return this.instance as INestApplication
  }

  /**
   * Merge compile options with default and persist them as configuration .
   * @param options
   */
  private static configureOptions(options: AppOptions): void {
    // here should be options which can be pass down as nested objects
    const deepMergeProps: (keyof AppOptions)[] = [/* 'cache', */ 'cors' /* 'logs', 'validator' */]

    this.options = { ...APP_DEFAULT_OPTIONS, ...options }

    for (const key of deepMergeProps) {
      const providedData = options[key] as Record<string, any>

      this.options[key as string] = {
        ...(APP_DEFAULT_OPTIONS[key] as Record<string, any>),
        ...providedData,
      }
    }

    if (this.options.cors) {
      this.options.cors = {
        ...this.options.cors,
        ...buildCorsOption(this.options.cors.whitelist),
      }
    }

    if (this.options.disableAll) {
      this.options.disableCache = true
      this.options.disableDocs = true
      this.options.disableFilter = true
      this.options.disableLogs = true
      this.options.disableMetrics = true
      this.options.disableScan = true
      this.options.disableSerializer = true
      this.options.disableHealthcheckStatus = true
      this.options.disableValidator = true
      this.options.disablePerformance = true
    }

    if (this.options.forceEnabled) {
      for (const [key, value] of Object.entries(this.options.forceEnabled)) {
        this.options[key] = value
      }
    }
  }

  /**
   * Creates NestJS instance using Fastify/Express as underlying adapter,
   * then configures the following framework specific settings:
   * - Add an on request hook which runs prior to all interceptors
   * - Set the global path prefix if any
   * - Set all middlewares
   * - Enable cors if configured
   */
  private static async configureAdapter(): Promise<void> {
    const { globalPrefix, cors } = this.options
    const entryModule = this.buildEntryModule()
    // const httpAdapter = new FastifyAdapter(fastify)

    this.instance = await NestFactory.create(entryModule)

    // TODO: is it need?
    this.instance.enableShutdownHooks()
    this.handleUnexpectedErrors()

    // ! We use here express.js adapter
    const expressInstance: ExpressAdapter = this.instance.getHttpAdapter().getInstance()

    expressInstance.use((req: AppRequest, res: AppResponse, next: () => void) => {
      this.sanitizeRequestHeaders(req)
      return this.createRequestContext(req, res, next)
    })

    // Trust proxy (e.g for k8s/nginx)
    // expressInstance.set('trust proxy', 1)

    // Sesssion + Redis middleware
    const configService = this.instance.get<ConfigService>(ConfigService)
    const redisClient = this.instance.get<Redis>(getRedisConnectionToken())

    expressInstance.use(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      session({
        store: new RedisStore({ client: redisClient }),
        secret: configService.get(Environment.SESSION_SECRET) as string,
        saveUninitialized: false,
        rolling: true, // -> https://github.com/expressjs/session#rolling
        resave: false, // default value
        name: 'session_id',
        cookie: {
          secure: configService.get(Environment.NODE_ENV) === EnvironmentMode.PRODUCTION,
          // 30 min
          maxAge: 60 * 2 * 1000,
          httpOnly: true,
          // TODO:lax or strict?
          sameSite: 'lax',
        },
      }),
    )

    expressInstance.use(passport.initialize())
    expressInstance.use(passport.session())

    expressInstance.use(cookieParser())
    // TODO: refactor to separate module(?)
    expressInstance.use(json({ limit: '50mb' }))
    expressInstance.use(urlencoded({ extended: true, limit: '50mb' }))

    this.instance.setGlobalPrefix(globalPrefix as string)
    this.instance.enableCors(cors)
  }

  /**
   * Fastify will attempt to parse request body even if content length
   * is set as zero, this leads to unintended bad requests for some
   * common http clients.
   * @param req
   */
  private static sanitizeRequestHeaders(req: AppRequest): void {
    const { headers } = req

    if (headers['content-length'] === '0') {
      delete headers['content-type']
    }
  }

  /**
   * Implements a request hook intended to run prior to any NestJS
   * component like guards and interceptors, which:
   * - Adds starting time to request in order to control timeout
   * - Set the automatically generated request id as response header
   * - Wraps the request into a context managed by async local storage
   * - Wraps the context into a trace span
   * - Set the trace id as response header.
   * @param req
   * @param res
   * @param next
   */
  private static createRequestContext(req: AppRequest, res: AppResponse, next: () => void): void {
    // const traceService = this.instance.get(TraceService)

    req.time = Date.now()

    // TODO: add full-fledged telemetry later
    ContextStorage.run(new Map(), () => {
      const store = ContextStorage.getStore()!
      // Create manual span
      const span: TManualTelemertrySpan = {
        spanContext: {} as Record<string, any>,
        setAttributes(attributes: Record<string, any>): void {
          span.spanContext = {
            ...span.spanContext,
            ...attributes,
          }
        },
      }

      /**
       * Add request and response to context
       */
      store.set(ContextStorageKey.REQUEST, req)
      store.set(ContextStorageKey.RESPONSE, res)

      span.setAttributes({ traceId: (req.headers['x-request-id'] as string) || uuidv4() })
      store.set(ContextStorageKey.REQUEST_SPAN, span)

      next()
    })
  }

  /**
   * Acquire current instance and list on desired port and hostname,
   * using and interceptor to manage configured timeout.
   */
  private static async listen(): Promise<void> {
    const { instance } = this.options

    const app = this.getInstance()
    const configService = app.get(ConfigService)

    const port = configService.get<number>(Environment.PORT) as number
    const hostname = configService.get<string>(Environment.HOSTNAME) as string

    await app.listen(port, hostname)

    // eslint-disable-next-line no-console
    console.log(`Instance ${instance} listening on port ${port}`)
  }

  /**
   * Given desired boot options, build the module that will act
   * as entry point for the cascade initialization.
   */
  private static buildEntryModule(): DynamicModule {
    /**
     * Reinitialize options
     */
    this.options.controllers ??= []
    this.options.providers ??= []
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.options.imports ??= []
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.options.exports ??= []

    return {
      module: AppModule,
      imports: this.buildModules('imports'),
      controllers: this.buildControllers(),
      providers: this.buildProviders(),
      exports: [
        /* AppConfig */
        AppService,
        ...this.options.providers,
        ...this.buildModules('exports'),
      ],
    }
  }

  /**
   * Merge defaults, project source and user provided modules.
   * @param type
   */
  private static buildModules(type: 'imports' | 'exports'): any[] {
    const { disableScan, disableCache, disableLogs, disableMetrics, disableTraces, assetsPrefix } =
      this.options

    const { imports: alwaysImportedModules, exports: alwaysExportedModules } = this.options

    const preloadedModules: any[] = []
    const sourceModules: unknown[] = []

    /* ContextModule, LogModule, MemoryModule,  */
    const defaultModules: ModuleMetadata['imports'] = [
      /**
       * Always enabled
       */

      /** Config */
      ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: Joi.object<TEnvironment>({
          // General
          PORT: Joi.number().required(),
          HOSTNAME: Joi.string().required(),
          NODE_ENV: Joi.string()
            .valid(EnvironmentMode.DEVELOPMENT, EnvironmentMode.PRODUCTION, EnvironmentMode.TESTING)
            .required(),
          CORS_WHITELIST: Joi.string().optional(),
          // Logger
          TRANSPORT_LEVELS: Joi.string().required(),
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
        envFilePath: './environments/.env.test',
      }),
      /** Context module */
      ContextModule,
      /** Promise module */
      PromiseModule,
      /** RBAC policy */
      AccessControlModule.forRoles(RBAC_POLICY),
      /** Static */
      ServeStaticModule.forRoot({
        rootPath: path.join(process.cwd(), assetsPrefix!),
      }),
    ]

    if (disableCache) {
      defaultModules.push(CacheDisabledModule.register())
    } else {
      /** Cache based on Redis */
      defaultModules.push(CacheModule.register())
      /** Cache-bucket endpoints */
      defaultModules.push(CacheBucketModule)
    }

    if (!disableLogs) {
      defaultModules.push(WinstonLoggerModule.register())
    }

    /**
     * Should be scrapping metrics (e.g Prometheus)
     */
    if (disableMetrics) {
      //   defaultModules.push(MetricDisabledModule)
    } else {
      //   defaultModules.push(MetricModule)
    }

    /**
     * Should be telemtry
     */
    if (disableTraces) {
      //   defaultModules.push(TraceDisabledModule)
    } else {
      //   defaultModules.push(TraceModule)
    }

    if (!disableScan) {
      //   sourceModules = AppModule.globRequire(['s*rc*/**/*.module.{js,ts}']).reverse()
    }

    if (type === 'imports') {
      preloadedModules.push(...defaultModules, ...sourceModules, ...alwaysImportedModules!)
    } else {
      preloadedModules.push(
        ...defaultModules,
        ...sourceModules,
        ...alwaysExportedModules!,
        'APP_CONFIG',
      )
    }

    return preloadedModules
  }

  /**
   * Adds app controller with machine status information.
   */
  private static buildControllers(): any[] {
    const { disableHealthcheckStatus, controllers } = this.options
    const preloadedControllers = [] as any[]

    if (!disableHealthcheckStatus) {
      preloadedControllers.push(AppController)
    }

    return [...preloadedControllers, ...controllers!]
  }

  /**
   * Adds exception filter, serializer, timeout and validation pipe.
   */
  private static buildProviders(): any[] {
    const { disableFilter, disablePerformance, disableLogs, providers } = this.options

    const preloadedProviders: any[] = [
      {
        provide: 'APP_CONFIG',
        /**
         * We complement this object during `bootstrap()` of application,
         * merging default options with custom ones from environment variables
         */
        useValue: this.options,
      },
      AppService,
    ]

    if (!disableFilter) {
      preloadedProviders.push({
        /**
         * Global exception filter
         */
        provide: APP_FILTER,
        useClass: AllExceptionFilter,
      })
    }

    if (!disableLogs) {
      preloadedProviders.push({
        /**
         * Global logger interceptor
         */
        provide: APP_INTERCEPTOR,
        useClass: LoggingInterceptor,
      })
    }

    if (!disablePerformance) {
      preloadedProviders.push({
        /**
         * Global performance interceptor
         */
        provide: APP_INTERCEPTOR,
        useClass: PerformanceInterceptor,
      })
    }

    return [...preloadedProviders, ...providers!]
  }

  /**
   * Handles uncaught exceptions.
   * @param error - The uncaught exception.
   */
  private static handleUncaughtException(error: Error): void {
    // eslint-disable-next-line no-console
    console.error('Uncaught Exception Handler in Bootstrap:', error)
    setTimeout(() => {
      process.exit(1)
    }, 1000)
  }

  /**
   * Handles unhandled rejections.
   * @param reason - The reason for the unhandled rejection.
   * @param promise - The rejected promise.
   */
  private static handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  }

  private static handleUnexpectedErrors(): void {
    process.on('uncaughtException', this.handleUncaughtException)
    process.on('unhandledRejection', this.handleUnhandledRejection)
  }

  /**
   * Set global middlewares
   */
  configure(consumer: MiddlewareConsumer): void {
    //     consumer
    //       .apply(
    //         session({
    //           store: new (RedisStore(session))({ client: this.redis, logErrors: true }),
    //           saveUninitialized: false,
    //           secret: 'sup3rs3cr3t',
    //           resave: false,
    //           cookie: {
    //             sameSite: true,
    //             httpOnly: false,
    //             maxAge: 60000,
    //           },
    //         }),
    //         passportInitialize(),
    //         passportSession(),
    //       )
    //       .forRoutes('*')
    //   }
  }
}
