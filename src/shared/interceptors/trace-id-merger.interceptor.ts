// import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
// import { Injectable, UseInterceptors } from '@nestjs/common'
// import type { Observable } from 'rxjs'
// import type { Request, Response } from 'express'

// export function TraceIdMergerInterceptor(): MethodDecorator & ClassDecorator {
//   return UseInterceptors(_TraceIdMergerInterceptor)
// }

// /**
//  * Using for extract generated traceId from middleware
//  * and merge with body.
//  */
// @Injectable()
// export class _TraceIdMergerInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
//     const request: Request = context.switchToHttp().getRequest()
//     const response: Response = context.switchToHttp().getResponse()
//     const body = request.body

//     const traceId: string | undefined = response.locals.traceId
//     console.log('🚀 ~ TraceIdMergerInterceptor ~ intercept ~ traceId:', traceId)

//     if (traceId) {
//       request.body = {
//         ...body,
//         traceId,
//       }
//     }

//     console.log('TraceIdMergerInterceptor request.body:', request.body)

//     return next.handle()
//   }
// }
