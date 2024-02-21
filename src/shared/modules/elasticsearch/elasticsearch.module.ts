import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ElasticsearchModule } from '@nestjs/elasticsearch'

import { Environment } from '../app'

@Module({
  imports: [
    ConfigModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node: configService.get(Environment.ELASTICSEARCH_NODE) as string,
        auth: {
          username: configService.get(Environment.ELASTICSEARCH_USERNAME) as string,
          password: configService.get(Environment.ELASTICSEARCH_PASSWORD) as string,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [ElasticsearchModule],
})
export class SearchModule {}
