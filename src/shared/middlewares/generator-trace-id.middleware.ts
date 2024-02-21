// import { Inject, Injectable } from '@nestjs/common'
// import type { NestMiddleware } from '@nestjs/common'

// import { AsyncLocalStorage } from 'node:async_hooks'
// import type { NextFunction } from 'express'
// import { v4 as uuidv4 } from 'uuid'

// import { ASYNC_STORAGE_TOKEN } from '@shared/modules/logger'
// import type { AppRequest, AppResponse } from '@shared/modules/app'

// /**
//  * Using for generating unique traceId
//  * for end-to-end logging
//  */
// @Injectable()
// export class GenerateTraceIdMiddleware implements NestMiddleware {
//   constructor(
//     @Inject(ASYNC_STORAGE_TOKEN)
//     private readonly asyncStorage: AsyncLocalStorage<Map<string, string>>,
//   ) {}

//   use(req: AppRequest, res: AppResponse, next: NextFunction): void {
//     const traceId = (req.headers['x-request-id'] as string) || uuidv4()

//     // res.locals.traceId = traceId

//     const store = new Map<string, string>().set('traceId', traceId)

//     /**
//      * The store is accessible only inside of the callback function
//      */
//     this.asyncStorage.run(store, () => {
//       next()
//     })
//   }
// }
