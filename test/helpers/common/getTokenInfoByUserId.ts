import type { PrismaService } from '@shared/modules/prisma/client'

export async function getTokenInfoByUserId(
  prisma: PrismaService,
  userId: number,
): Promise<{
  emailConfirmationToken: string | null
  isEmailConfirmed: boolean
}> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      emailConfirmationToken: true,
      isEmailConfirmed: true,
    },
  })

  return user as {
    emailConfirmationToken: string
    isEmailConfirmed: boolean
  }
}
