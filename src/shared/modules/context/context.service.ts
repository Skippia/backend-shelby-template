/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common'
import type { ValidatorOptions } from 'class-validator'

import { CacheStatus } from '../cache/cache.enum'
import type { TManualTelemertrySpan } from './context.enum'
import { ContextStorageKey } from './context.enum'
import type { AppRequest, AppResponse } from '../app'
import { ContextStorage } from './context.storage'

@Injectable()
export class ContextService<Metadata = Record<string, any>> {
  /**
   * Get local store for current context.
   */
  public getStore(): Map<string, any> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return ContextStorage.getStore()
  }

  /**
   * Get context request.
   */
  public getRequest(): AppRequest {
    return this.getStore()?.get(ContextStorageKey.REQUEST)
  }

  /**
   * Get context response.
   */
  public getResponse(): AppResponse {
    return this.getStore()?.get(ContextStorageKey.RESPONSE)
  }

  /**
   * Get request span.
   */
  public getRequestSpan(): TManualTelemertrySpan | undefined {
    return this.getStore()?.get(ContextStorageKey.REQUEST_SPAN)
  }

  /**
   * Get context trace ID.
   */
  public getRequestTraceId(): string | undefined {
    return this.getRequestSpan()?.spanContext.traceId
  }

  /**
   * Reads a metadata key bound to current request lifecycle.
   * @param key
   */
  public getMetadata<K extends keyof Metadata>(key: K): Metadata[K] {
    const metadata: Metadata = this.getStore()?.get(ContextStorageKey.REQUEST_METADATA) || {}
    return metadata[key]
  }

  /**
   * Create or update a metadata key bound to current request lifecycle.
   * @param key
   * @param value
   */
  public setMetadata<K extends keyof Metadata>(key: K, value: Metadata[K]): void {
    // 1. Get old metadata from store
    const metadata: Metadata = this.getStore()?.get(ContextStorageKey.REQUEST_METADATA) || {}
    // 2. Update metadata object
    metadata[key] = value
    // 3. Update metadata in store
    this.getStore()?.set(ContextStorageKey.REQUEST_METADATA, metadata)
  }

  /**
   * Reads all metadata bound to current request lifecycle,
   * returning object should be immutable.
   */
  public getRequestMetadata(): Metadata {
    const metadata: Metadata = this.getStore()?.get(ContextStorageKey.REQUEST_METADATA)
    return this.validateObjectLength(metadata as Record<string, any>) as Metadata
  }

  /**
   * Acquire request id.
   */
  public getRequestId(): string | undefined {
    return this.getRequest().id
  }

  /**
   * Acquire request method.
   */
  public getRequestMethod(): string | undefined {
    return this.getRequest().method
  }

  /**
   * Acquire request protocol.
   */
  public getRequestProtocol(): string | undefined {
    return this.getRequest().protocol
  }

  /**
   * Acquire request host.
   */
  public getRequestHost(): string | undefined {
    return this.getRequest().hostname
  }

  /**
   * Acquire request path.
   */
  public getRequestPath(): string | undefined {
    const req = this.getRequest()

    if (!req) {
      return
    }

    // TODO: try to debug it later
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return req.routeOptions?.url || req.url.split('?')[0]
  }

  /**
   * Builds a request description including method and path.
   * @param step
   */
  public getRequestDescription(step: 'in' | 'out'): string {
    const description = `${this.getRequestMethod()} ${this.getRequestPath()}`

    return step === 'in' ? `⯈ ${description}` : `⯇ ${description}`
  }

  /**
   * Acquire request path replacement params.
   */
  public getRequestParams(): Record<string, any> | undefined {
    const req = this.getRequest()

    if (req.params) {
      delete req.params['*']
    }

    return this.validateObjectLength(req.params as Record<string, any>)
  }

  /**
   * Acquire request query params.
   */
  public getRequestQuery(): Record<string, any> | undefined {
    return this.validateObjectLength(this.getRequest().query as Record<string, any>)
  }

  /**
   * Acquire request body.
   */
  public getRequestBody(): Record<string, any> | undefined {
    return this.validateObjectLength(this.getRequest().body as Record<string, any>)
  }

  /**
   * Acquire request client IP.
   */
  public getRequestIp(): string | undefined {
    const req = this.getRequest()

    if (!req) {
      return
    }

    return req.ips[req.ips.length - 1] || req.ip
  }

  /**
   * Acquire all request headers.
   */
  public getRequestHeaders(): Record<string, any> | undefined {
    return this.validateObjectLength(this.getRequest().headers as Record<string, any>)
  }

  /**
   * Acquire specific request header.
   * @param key
   */
  public getRequestHeader(key: string): string | undefined {
    return this.getRequestHeaders()?.[key.toLowerCase()]
  }

  /**
   * Acquire current request duration in seconds.
   */
  public getRequestDuration(): number | undefined {
    const req = this.getRequest()

    if (!req) {
      return
    }

    return (Date.now() - req.time) / 1000
  }

  /**
   * Acquire current response status code.
   */
  public getResponseCode(): number | undefined {
    return this.getResponse().statusCode
  }

  /**
   * Acquire all response headers.
   */
  public getResponseHeaders(): Record<string, string> | undefined {
    return this.getResponse().getHeaders()
  }

  /**
   * Acquire specific response header.
   * @param key
   */
  public getResponseHeader(key: string): string | undefined {
    return this.getResponse().getHeader(key)
  }

  /**
   * Acquires validator options of current context.
   */
  public getValidatorOptions(): ValidatorOptions | undefined {
    return this.getStore()?.get(ContextStorageKey.VALIDATOR_OPTIONS)
  }

  /**
   * Set validator options of current context.
   * @param options
   */
  public setValidatorOptions(options: ValidatorOptions): void {
    this.getStore()?.set(ContextStorageKey.VALIDATOR_OPTIONS, options)
  }

  /**
   * Acquires cache status of current context.
   */
  public getCacheStatus(): CacheStatus {
    const cacheStatus = this.getStore()?.get(ContextStorageKey.CACHE_STATUS)
    return cacheStatus || CacheStatus.DISABLED
  }

  /**
   * Set cache status of current context.
   * @param status
   */
  public setCacheStatus(status: CacheStatus): void {
    this.getStore()?.set(ContextStorageKey.CACHE_STATUS, status)
    this.getResponse().header('Cache-Status', status)
  }

  /**
   * Ensures target object is valid and contain at least one key,
   * if not return as `undefined`.
   * @param obj
   */
  private validateObjectLength(
    obj?: Record<string, any> | undefined,
  ): Record<string, any> | undefined {
    if (Object.keys(obj || {}).length > 0) {
      return obj
    }

    return undefined
  }
}
