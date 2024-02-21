import { createUsers } from 'test/helpers/create'

import { initApp } from 'test/helpers/common'

import { ScheduleModule } from '@nestjs/schedule'

import { PrismaClient } from '@prisma/db'

import { PrismaModule } from './client'
import type { PrismaService } from './client'

const prisma = new PrismaClient() as PrismaService

async function seedDb(): Promise<void> {
  // Create users
  await createUsers(prisma)

  // ...
}

async function main(): Promise<void> {
  await initApp({
    imports: [PrismaModule.register(), ScheduleModule.forRoot()],
    typeRunning: 'compile',
  })

  await seedDb()
}
// execute the main function
main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect()
    process.exit(0)
  })
