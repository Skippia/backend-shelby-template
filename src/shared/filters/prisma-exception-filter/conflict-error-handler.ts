import { HttpStatus } from '@nestjs/common'

import type { Prisma } from '@prisma/db'

import { unwindArrayToValue } from '@shared/helpers/transformers'

/**
 * P2002
 */
export function conflictErrorHandler(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: HttpStatus
  message: string
  errorName: string
} {
  const statusCode = HttpStatus.CONFLICT
  const rawMessage = error.message

  const target = unwindArrayToValue(error.meta?.target) as string

  function cutFromString(str: string, substring: string): string {
    const index = str.indexOf(substring)
    return index === -1 ? str : str.slice(index)
  }

  const messageCleanedCut = cutFromString(rawMessage, 'Unique constraint')

  const message = 'Prisma: Unique constraint violation'

  const messageCleaned = messageCleanedCut
    ? messageCleanedCut
    : target
      ? `${message}: (target = ${target})`
      : message

  return {
    statusCode,
    message: `[${error.code}]: ${messageCleaned}`,
    errorName: 'PrismaConflictError',
  }
}
