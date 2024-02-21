import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { HttpStatus, Injectable } from '@nestjs/common'

import type { Observable } from 'rxjs'
import { map } from 'rxjs'

import { streamFileAsZip, streamFileAsPdf } from '@certificate/presenter/helpers'
import { tryUnwindArrayToValue } from '@shared/helpers/transformers'
import { ContextService } from '@shared/modules/context'
import type { AppResponse } from '@shared/modules/app'

@Injectable()
export class TransformInStreamableFileInterceptorAsPdfOrZip implements NestInterceptor {
  constructor(public readonly contextService: ContextService) {}
  intercept(context: ExecutionContext, handler: CallHandler): Observable<unknown> {
    return handler.handle().pipe(
      map(async (_files: Buffer | Buffer[] | null) => {
        let files: Buffer | Buffer[] | null

        if (Array.isArray(_files)) {
          files = tryUnwindArrayToValue(_files)
        } else {
          files = _files instanceof Buffer ? _files : null
        }

        const res: AppResponse = this.contextService.getResponse()

        if (!files) {
          res.status(HttpStatus.OK)
          return null
        }

        // If we have more than 1 certificate - return them as a zip
        if (Array.isArray(files)) {
          return await streamFileAsZip(res, files)
        }

        return streamFileAsPdf(res, files)
      }),
    )
  }
}
