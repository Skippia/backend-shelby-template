import { Module } from '@nestjs/common'

import { CacheBucketController } from './cache-bucket.controller'

@Module({
  controllers: [CacheBucketController],
})
export class CacheBucketModule {}
