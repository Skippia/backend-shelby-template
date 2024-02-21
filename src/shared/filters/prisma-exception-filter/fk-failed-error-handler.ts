import { HttpStatus } from '@nestjs/common'

import type { Prisma } from '@prisma/db'

import { unwindArrayToValue } from '@shared/helpers/transformers'

/**
 * P2003
 */
export function fkFailedErrorHandler(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: HttpStatus
  message: string
  errorName: string
} {
  const statusCode = HttpStatus.BAD_REQUEST
  const message = 'Prisma: Operation with not existing foreign key'

  const target = unwindArrayToValue(error.meta?.target) as string

  const messageCleaned = target ? `${message}: (target = ${target})` : message

  return {
    statusCode,
    message: messageCleaned,
    errorName: 'PrismaFkFailedError',
  }
}
