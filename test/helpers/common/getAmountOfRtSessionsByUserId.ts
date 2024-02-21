import type { PrismaService } from '@shared/modules/prisma/client'

export async function getAmountOfRtSessionsByUserId(
  prisma: PrismaService,
  userId: number,
): Promise<number> {
  return await prisma.rTSession.count({
    where: {
      userId,
    },
  })
}
