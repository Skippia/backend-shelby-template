/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Injectable } from '@nestjs/common'
import os from 'os'

import type { AppStatus } from './app.types'
import { ContextService } from '../context'

@Injectable()
export class AppService {
  public constructor(
    private readonly contextService: ContextService,
    // private readonly metricService: MetricService,
  ) {}

  /**
   * Reads data regarding current runtime and network.
   */
  public getStatus(): AppStatus {
    return {
      system: {
        version: os.version(),
        type: os.type(),
        release: os.release(),
        architecture: os.arch(),
        endianness: os.endianness(),
        uptime: os.uptime(),
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
      },
      cpus: os.cpus(),
      network: {
        interfaces: os.networkInterfaces(),
      },
    }
  }

  /**
   * Register logs, metrics and tracing of inbound request.
   *
   * In the event of paths unspecified by controllers, replace them with
   * `*` in order to reduce amount of timeseries.
   * @param code
   * @param error
   */
  /*  public collectInboundTelemetry(code: HttpStatus, error?: Error): void {
    const span = this.contextService.getRequestSpan()
    const method = this.contextService.getRequestMethod() as HttpMethod
    const duration = this.contextService.getRequestDuration()

    const path =
      code === HttpStatus.NOT_FOUND && error?.message.startsWith('Cannot')
        ? '/*'
        : this.contextService.getRequestPath()

    if (span) {
      span.setAttributes({
        'http.method': method,
        'http.path': path,
        'http.status_code': code,
        'http.duration': duration,
      })

      if (error) {
        span.setAttributes({ 'http.error-message': error.message })
      }
    }
  } */
}
