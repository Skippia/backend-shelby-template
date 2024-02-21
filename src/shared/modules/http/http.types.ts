/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/member-ordering */
import type { HttpStatus, ModuleMetadata } from '@nestjs/common'
// import type { Span, SpanOptions } from '@opentelemetry/api'
import type { StringifyOptions } from 'query-string'

import type { CacheStatus } from '../cache/cache.enum'
import type { HttpMethod, HttpRedirect } from './http.enum'
import type { HttpError } from './http.error'

export type HttpAsyncModuleOptions = {
  inject?: any[]
  useFactory(...args: any[]): Promise<HttpModuleOptions> | HttpModuleOptions
} & Pick<ModuleMetadata, 'imports'>

/**
 * HTTP options usable at application level.
 */
export type HttpOptions = {
  /** Request timeout in milliseconds. Default: 60s. */
  timeout?: number
  /** Response parser. Default: Parse as JSON or text based on response `Content-Type`, otherwise as buffer. */
  parser?(res: HttpResponse): Promise<unknown>
  /** Max amount of retries. Default: 2. */
  retryLimit?: number
  /** HTTP methods to enable retry. Default: [ 'GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE' ]. */
  retryMethods?: HttpMethod[]
  /** Response codes to attempt a retry. Default: [ 408, 429, 500, 502, 503, 504 ]. */
  retryCodes?: HttpStatus[]
  /** Retry delay in milliseconds based on number of attempts. Default: (a) => a > 4 ? 16_000 : 2 ** (a - 1) * 1000. */
  retryDelay?(attempts: number): number
  /** Time to live in milliseconds, cache is disable when zero. Default: 0. */
  cacheTtl?: number
  /** HTTP methods to enable cache. Default: [ 'GET', 'HEAD' ]. */
  cacheMethods?: HttpMethod[]
  /** Time in milliseconds to await for cache acquisition before processing regularly. Default: 500ms. */
  cacheTimeout?: number
}

/**
 * HTTP options shared between module and request level.
 */
export type HttpSharedOptions = {
  /** Returns the full `Response` object from `fetch()` API. */
  fullResponse?: boolean
  /** In case of an exception code, ignores it and resolve request. */
  ignoreExceptions?: boolean
  /** In case of an exception, will return to client the exact same code and body from upstream. */
  proxyExceptions?: boolean
  /** Custom undici agent. Requires installation of `undici` package and configuration with `new Agent()`. */
  dispatcher?: unknown
  /** Username for Basic authentication. */
  username?: string
  /** Password for Basic authentication. */
  password?: string
  /** Whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect. */
  redirect?: HttpRedirect
  /** Request headers. */
  headers?: Record<string, string>
}

/**
 * HTTP options usable at module level.
 */
export type HttpModuleOptions = {
  /** Disable logs, metrics and traces. */
  disableTelemetry?: boolean
  /** Disable trace propagation. */
  disablePropagation?: boolean
  /** Request base URL. */
  baseUrl?: string
} & HttpOptions &
  HttpSharedOptions

/**
 * HTTP options usable at request level.
 */
export type HttpRequestOptions = {
  /** Request method. */
  method?: HttpMethod
  /** Object containing replacement string for path variables. */
  replacements?: Record<string, string | number>
  /** Request query params with array joining support. */
  query?: Record<string, any>
  /** Query stringify options. */
  queryOptions?: StringifyOptions
  /** Request body. Should not be used in combination with `json` or `form`. */
  body?: any
  /** Request body to be sent as JSON. Should not be used in combination with `body` or `form`. */
  json?: any
  /** Request body to be sent as form encoded. Should not be used in combination with `body` or `json`. */
  form?: Record<string, any>
} & Omit<HttpOptions, 'retryMethods' | 'cacheMethods'> &
  HttpSharedOptions

export type HttpRequestSendParams = {
  url: string
  scheme: string
  host: string
  path: string
} & Pick<
  HttpRequestOptions,
  | 'timeout'
  | 'dispatcher'
  | 'username'
  | 'password'
  | 'redirect'
  | 'method'
  | 'replacements'
  | 'headers'
  | 'query'
  | 'queryOptions'
  | 'body'
  | 'json'
  | 'form'
>

export type HttpRetrySendParams = {
  attempt: number
} & Pick<HttpOptions, 'retryLimit' | 'retryCodes' | 'retryDelay'>

export type HttpCacheSendParams = Pick<HttpOptions, 'cacheTtl' | 'cacheMethods' | 'cacheTimeout'>

export type HttpTelemetrySendParams = {
  //   spanOptions: SpanOptions
  start?: number
  cacheStatus?: CacheStatus
}

export type HttpSendParams = {
  fullResponse: boolean
  ignoreExceptions: boolean
  proxyExceptions: boolean
  parser(res: HttpResponse): Promise<unknown>
  request: HttpRequestSendParams
  retry: HttpRetrySendParams
  telemetry: HttpTelemetrySendParams
  cache: HttpCacheSendParams
  //   span?: Span
  response?: HttpResponse<any>
  error?: HttpError
}

export type HttpCookie = {
  name: string
  value: string
  domain: string
  path: string
  expires: Date
}

export type HttpResponse<T = unknown> = {
  cookies?: HttpCookie[]
  data?: T
} & Response

export type HttpExceptionData = {
  message: string
  proxyExceptions: boolean
  outboundRequest: HttpRequestSendParams
  outboundResponse: {
    code: HttpStatus
    headers: Record<string, string>
    body: unknown
  }
}
