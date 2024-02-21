import { createParamDecorator } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'

import type { JwtPayload } from '@auth-jwt/domain/helpers/types'

export const GetCurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()

    if (!data) {
      return request.user
    }

    return request.user[data]
  },
)
