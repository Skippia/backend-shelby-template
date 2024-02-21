import { createParamDecorator } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'

import type { JwtPayload } from '@auth-jwt/domain/helpers/types'

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest()
    const user = request.user as JwtPayload
    return user.sub
  },
)
