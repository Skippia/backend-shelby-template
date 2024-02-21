import { UseInterceptors } from '@nestjs/common'
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs'
import type { Observable } from 'rxjs'
import type { ZodSchema } from 'zod'

export function ZodSerializerInterceptor(zodSchema: ZodSchema): MethodDecorator & ClassDecorator {
  return UseInterceptors(new _ZodSerializerInterceptor(zodSchema))
}

export class _ZodSerializerInterceptor implements NestInterceptor {
  constructor(private zodSchema: ZodSchema) {}

  intercept(_context: ExecutionContext, handler: CallHandler): Observable<unknown> {
    return handler.handle().pipe(map((data: unknown) => this.zodSchema.parse(data)))
  }
}
