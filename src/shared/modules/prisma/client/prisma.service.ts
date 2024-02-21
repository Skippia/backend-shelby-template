import { Injectable } from '@nestjs/common'
import type { INestApplication, OnModuleDestroy, OnModuleInit } from '@nestjs/common'

import { PrismaClient } from '@prisma/db'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(databaseUri: string) {
    super({
      datasources: {
        db: {
          url: databaseUri,
        },
      },
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }

  enableShutdownHooks(app: INestApplication): void {
    // @ts-expect-error i don't know, really
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.$on('beforeExit', async (): Promise<void> => {
      await app.close()
    })
  }

  async truncate(): Promise<void> {
    const records = await this.$queryRawUnsafe<Array<{ tablename: string }>>(`SELECT tablename
                                                          FROM pg_tables
                                                          WHERE schemaname = 'public'`)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    records.forEach((record) => this.truncateTable(record.tablename))
  }

  async truncateTable(tablename?: string): Promise<void> {
    if (tablename === undefined || tablename === '_prisma_migrations') {
      return
    }
    try {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.meta.code === '40P01') {
        // eslint-disable-next-line no-console
        console.error('DEADLOCK OCCURED')
      } else {
        // eslint-disable-next-line no-console
        console.error('UNEXPECTED DB ERROR', JSON.stringify(error.meta))
      }
    }
  }

  async resetSequences(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await this.$queryRawUnsafe<Array<any>>(
      `SELECT c.relname
       FROM pg_class AS c
                JOIN pg_namespace AS n ON c.relnamespace = n.oid
       WHERE c.relkind = 'S'
         AND n.nspname = 'public'`,
    )

    for (const record of results) {
      await this.$executeRawUnsafe(`ALTER SEQUENCE "public"."${record.relname}" RESTART WITH 1;`)
    }
  }

  async clearDatabase(): Promise<void> {
    await this.truncate()
    await this.resetSequences()
    await this.$disconnect()
  }
}
