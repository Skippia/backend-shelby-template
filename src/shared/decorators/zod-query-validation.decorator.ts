// /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// import { createParamDecorator } from '@nestjs/common'
// import type { ExecutionContext } from '@nestjs/common'
// import type { Request } from 'express'
// import type { ZodSchema } from 'zod'

// // @typescript-eslint/explicit-function-return-type
// // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
// export const ZodQueryValidator = (querySchemaValidator: ZodSchema) =>
//   createParamDecorator((data: string, context: ExecutionContext) => {
//     const request: Request = context.switchToHttp().getRequest()

//     const query = request.query

//     querySchemaValidator.parse(query)

//     return query
//   })
