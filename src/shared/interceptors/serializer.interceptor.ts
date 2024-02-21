import { UseInterceptors } from '@nestjs/common'
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs'
// import { plainToInstance } from 'class-transformer'
import type { Observable } from 'rxjs'

type ClassConstructor<T = unknown> = new (...args: Array<unknown>) => T

export function Serialize<T>(dto: ClassConstructor<T>): MethodDecorator & ClassDecorator {
  return UseInterceptors(new SerializerInterceptor(dto))
}

export class SerializerInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor) {}

  intercept(_context: ExecutionContext, handler: CallHandler): Observable<unknown> {
    return handler.handle().pipe(
      map((data: object | Array<object>) =>
        /*   return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        }) */
        Array.isArray(data) ? data.map((el) => new this.dto(el)) : new this.dto(data),
      ),
    )
  }
}
