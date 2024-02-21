import { HttpStatus } from '@nestjs/common'

import type { Prisma } from '@prisma/db'

import { unwindArrayToValue } from '@shared/helpers/transformers'

/**
 * P2025
 */
export function throwNotFoundHandler(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: HttpStatus
  message: string
  errorName: string
} {
  const statusCode = HttpStatus.NOT_FOUND
  const message = 'Prisma: not found'
  const target = unwindArrayToValue(error.meta?.target)
  const cause = unwindArrayToValue(error.meta?.cause)

  const info = target || cause

  const messageCleaned = info
    ? `${message}: (${target ? 'target' : 'cause'} = ${JSON.stringify(info)})`
    : message

  return {
    statusCode,
    message: messageCleaned,
    errorName: 'PrismaNotFoundError',
  }
}
