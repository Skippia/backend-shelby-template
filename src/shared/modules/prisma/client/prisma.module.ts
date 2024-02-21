import { Module } from '@nestjs/common'
import type { DynamicModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { Environment } from '@shared/modules/app'

import { PrismaService } from './prisma.service'

@Module({})
// TODO: check if it can be singleton
export class PrismaModule {
  static PRISMA_CLIENT = 'PrismaClient'
  static register(DB_URI = Environment.DB_URI): DynamicModule {
    const providers = [
      {
        inject: [ConfigService],
        provide: PrismaModule.PRISMA_CLIENT,

        useFactory: (config: ConfigService): PrismaService => {
          const databaseUri = config.get<string>(DB_URI) as string

          return new PrismaService(databaseUri)
        },
      },
    ]

    return {
      module: PrismaModule,
      providers,
      exports: [PrismaModule.PRISMA_CLIENT],
    }
  }
}
