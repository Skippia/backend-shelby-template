/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HttpException, HttpStatus, INestApplication, ModuleMetadata } from '@nestjs/common'

import type { ValidatorOptions } from 'class-validator'
import type http from 'http'
import type { Request, Response } from 'express'
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

import type os from 'os'

import type { JwtPayload } from '@auth-jwt/domain/helpers/types'

import type { CacheOptions } from '@shared/modules/cache'

import type { HttpMethod } from '../http'
import type { LogOptions } from '../logger'

// import type { CacheOptions } from '../cache/cache.interface'
// import type { ConsoleOptions } from '../console/console.interface'
// import type { DocOptions } from '../doc/doc.interface'
// import type { HttpMethod } from '../http/http.enum'
// import type { HttpExceptionData, HttpOptions } from '../http/http.interface'
// import type { LokiOptions } from '../loki/loki.interface'
// import type { MetricOptions } from '../metric/metric.interface'
// import type { TraceOptions } from '../trace/trace.interface'

/**
 * App boot options types
 */
export type TDisableBootOptions = {
  /** Disables automatically importing `*.module.ts` files. */
  disableScan?: boolean
  /** Disables status endpoints `/` and `/status`. */
  disableHealthcheckStatus?: boolean
  /** Disables built-in exception filter `app.filter.ts`. */
  disableFilter?: boolean
  /** Disables serialization interceptor which applies `class-transformer` decorators. */
  disableSerializer?: boolean
  /** Disables validation pipe which applies `class-validator` decorators. */
  disableValidator?: boolean
  /** Disables HTTP caching. */
  disableCache?: boolean
  /** Disables all logging transports (Console and Loki). */
  disableLogs?: boolean
  /** Disables metrics collector and `metrics` endpoint. */
  disableMetrics?: boolean
  /** Disables request tracer. */
  disableTraces?: boolean
  /** Disables documentation generator and `docs` endpoint. */
  disableDocs?: boolean
  /** Disables performance interceptor */
  disablePerformance?: boolean
}
export type TDisableAllBootOptions = {
  /** Disables all custom implementations (which can also be individually disabled). */
  disableAll?: boolean
  forceEnabled?: TDisableBootOptions
}

export type AppOptions = {
  /** Provide an already built instance to skip `.compile()` step. */
  app?: INestApplication
  /** Environment variables file path. Default: Scans for `.env` on current and parent dirs. */
  envPath?: string
  /** Application name, also used as job name for telemetry. */
  name?: string
  /** Instance ID for telemetry. */
  instance?: string
  /** Application prefix to apply to all endpoints. */
  globalPrefix?: string
  /** Application static assets path relative to current work directory. Default: `assets`. */
  assetsPrefix?: string
  /** Application request timeout in milliseconds. Default: 60s. */
  timeout?: number
  /** Application CORS response. */
  cors?: CorsOptions & {
    whitelist: Set<string>
  }
  /** HTTP exceptions that should be logged as errors. Default: Array of all `5xx` status. */
  httpErrors?: HttpStatus[]
  /** Extra underlying HTTP adapter options. */
  //   fastify?: { [key: string]: any }
  /** Validation pipe options. Can be overwritten per request using `ContextService`. */
  validator?: ValidatorOptions
  /** Cache configuration. */
  // TODO: fix - it should not be optional
  cache?: CacheOptions
  /** Http configuration. */
  //   http?: HttpOptions
  // TODO: fix - it should not be optional
  /** Logs configuration. */
  logs?: LogOptions
  /** Console logging transport configuration. */
  //   console?: ConsoleOptions
  /** Loki logging transport configuration. */
  //   loki?: LokiOptions
  /** Metrics configuration. */
  //   metrics?: MetricOptions
  /** Traces configuration. */
  //   traces?: TraceOptions
  /** Documentation configuration. */
  //   docs?: DocOptions
} & ModuleMetadata &
  (TDisableBootOptions & TDisableAllBootOptions)

/**
 * Equivalent to request wrapper created by Fastify
 * after going through the middlewares.
 */
export type AppRequest = {
  // Only for authorized users
  user?: JwtPayload
  time: number
  query: any
  body: Record<string, any>
  params: any
  headers: any
  raw: AppRawRequest
  server: any
  path: string
  id: string
  log: any
  ip: string
  ips: string[]
  hostname: string
  protocol: 'http' | 'https'
  method: HttpMethod
  url: string
  routerMethod: string
  is404: boolean
  socket: any
  context: any
  routeOptions?: {
    method: HttpMethod
    url: string
    bodyLimit: number
    attachValidation: boolean
    logLevel: string
    exposeHeadRoute: boolean
    prefixTrailingSlash: string
  }
} & Request

/**
 * Equivalent to http request before applying middlewares.
 */
export type AppRawRequest = {
  metadata: any
} & http.IncomingMessage

export type AppResponse = {
  statusCode: number
  server: any
  serializer: any
  sent: boolean
  log: any
  request: AppRequest
  context: any
  raw: http.ServerResponse
  code(code: number): void
  //   status(code: number): void
  header(name: string, value: string): void
  headers(headers: Record<string, string>): void
  getHeader(name: string): any
  getHeaders(): Record<string, any>
  removeHeader(name: string): void
  hasHeader(name: string): boolean
  type(value: string): void
  redirect(code: number, dest: string): void
  callNotFound(): void
  serialize(payload: any): string
  send(payload: any): void
} & Response

export type AppException = {
  exception: HttpException | Error
  code: HttpStatus
  message: string
  //   details: AppExceptionDetails
}

// export type AppExceptionDetails = {
//   constraints?: string[]
// } & Partial<HttpExceptionData> & { [key: string]: any }

export type AppExceptionResponse = {
  code: number
  body: unknown
}

/**
 * App status system types
 */
export type AppStatusSystem = {
  version: string
  type: string
  release: string
  architecture: string
  endianness: string
  uptime: number
}

export type AppStatusMemory = {
  total: number
  free: number
}

export type AppStatusCpuTimes = {
  user: number
  nice: number
  sys: number
  idle: number
  irq: number
}

export type AppStatusCpu = {
  model: string
  speed: number
  times: AppStatusCpuTimes
}

export type AppStatusNetwork = {
  interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>
}

export type AppStatus = {
  system: AppStatusSystem
  cpus: AppStatusCpu[]
  memory: AppStatusMemory
  network: AppStatusNetwork
}
