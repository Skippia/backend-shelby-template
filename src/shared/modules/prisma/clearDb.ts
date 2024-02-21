/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { NestApplication } from '@nestjs/core'
import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import { PrismaClient } from '@prisma/db'

import { AppModule } from '@shared/modules/app/app.module'

import type { PrismaService } from './client'
import { PrismaModule } from './client'

const prisma = new PrismaClient() as PrismaService

let prismaInApp: PrismaService
let app: NestApplication

async function createApp() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  app = moduleFixture.createNestApplication()
  prismaInApp = app.get<PrismaService>(PrismaModule.PRISMA_CLIENT)

  await app.init()
}

async function main(): Promise<void> {
  await createApp()
  async function clearDb(): Promise<void> {
    await prismaInApp.clearDatabase()
  }

  await clearDb()
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
