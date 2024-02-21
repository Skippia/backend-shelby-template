// import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
// import { Injectable, Inject, UseInterceptors } from '@nestjs/common'
// import { Observable } from 'rxjs'
// import { AsyncLocalStorage } from 'node:async_hooks'

// import { ASYNC_STORAGE } from '@shared/dynamic-modules/logger'

// export function ExtractTraceIdInterceptor(): MethodDecorator & ClassDecorator {
//   return UseInterceptors(_ExtractTraceIdInterceptor)
// }

// @Injectable()
// export class _ExtractTraceIdInterceptor implements NestInterceptor {
//   constructor(
//     @Inject(ASYNC_STORAGE)
//     private readonly asyncStorage: AsyncLocalStorage<Map<string, string>>,
//   ) {}

//   intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
//     const traceId = context.getArgs()[0].traceId as string

//     const store = new Map<string, string>().set('traceId', traceId)

//     return new Observable((subscriber) => {
//       /**
//        * The store is accessible only inside of the callback function
//        */
//       const subscription = this.asyncStorage.run(store, () =>
//         /**
//          * - run the handler function in the run callback, so that myStore is set
//          * - subscribe to the handler and pass all emissions of the callHandler to our subscriber
//          */
//         next.handle().subscribe(subscriber),
//       )
//       /**
//        * return an unsubscribe method
//        */
//       return () => subscription.unsubscribe()
//     })
//   }
// }
