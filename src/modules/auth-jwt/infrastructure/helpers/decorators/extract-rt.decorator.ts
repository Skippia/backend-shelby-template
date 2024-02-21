import { createParamDecorator } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'

import type { Request } from 'express'

import { rtExtractor } from '../rt-extractor'

export const ExtractRt = createParamDecorator((data: undefined, context: ExecutionContext) => {
  const request: Request = context.switchToHttp().getRequest()

  return rtExtractor(request)
})
