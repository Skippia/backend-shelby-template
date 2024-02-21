import type { PrismaService } from '@shared/modules/prisma/client'

export async function getAmountOfCertificatesByUserId(
  prisma: PrismaService,
  userId: number,
): Promise<number> {
  return await prisma.certificate.count({
    where: {
      userId,
    },
  })
}

export async function getAmountOfAllCertificates(prisma: PrismaService): Promise<number> {
  return await prisma.certificate.count()
}
