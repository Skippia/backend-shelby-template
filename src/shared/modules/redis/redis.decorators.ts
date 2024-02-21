import { Inject } from '@nestjs/common'

import { getRedisConnectionToken } from './redis.utils'

export const InjectRedis = (connection?: string): PropertyDecorator & ParameterDecorator =>
  Inject(getRedisConnectionToken(connection))
