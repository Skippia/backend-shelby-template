/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
import { HttpStatus } from '@nestjs/common'
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'

import crypto from 'node:crypto'

import { CACHE_DEFAULT_OPTIONS } from '@shared/modules/cache/cache.config'

import type { AppOptions } from './app.types'

type TCorsBuilder = (whitelist: Set<string>) => CorsOptions

export const buildCorsOption: TCorsBuilder = (whitelist) => ({
  origin(origin, callback): void {
    if (!origin || whitelist.has(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  // TODO: figure out if OPTIONS is need
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  preflightContinue: false,
  credentials: true,
  optionsSuccessStatus: 204,
})

// export const FASTIFY_DEFAULT_OPTIONS: { [key: string]: any } = {
//   trustProxy: true,
//   genReqId: () => crypto.randomBytes(16).toString('hex'),
// }

export const APP_DEFAULT_OPTIONS: AppOptions = {
  name: 'unknown',
  instance: crypto.randomBytes(8).toString('hex'),
  assetsPrefix: 'static',
  timeout: 60_000,
  cors: {
    // default value
    whitelist: new Set(['localhost:3000']),
  },
  httpErrors: [
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.NOT_IMPLEMENTED,
    HttpStatus.BAD_GATEWAY,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT,
    HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
  ],
  globalPrefix: 'api/v1',
  //   fastify: FASTIFY_DEFAULT_OPTIONS,
  //   validator: VALIDATOR_DEFAULT_OPTIONS,
  cache: CACHE_DEFAULT_OPTIONS,
  //   http: HTTP_DEFAULT_OPTIONS,
  //   metrics: METRIC_DEFAULT_OPTIONS,
  //   traces: TRACE_DEFAULT_OPTIONS,
}
