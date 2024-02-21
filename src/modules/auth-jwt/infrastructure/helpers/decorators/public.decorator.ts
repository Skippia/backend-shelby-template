import { SetMetadata } from '@nestjs/common'
import type { CustomDecorator } from '@nestjs/common'

export const Public = (): CustomDecorator => SetMetadata('isPublic', true)
