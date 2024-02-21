/* eslint-disable @darraghor/nestjs-typed/api-method-should-specify-api-response */
import { Controller, Get, Param, Delete, Inject } from '@nestjs/common'

import { ApiTags } from '@nestjs/swagger'

import { CacheModule, CacheService } from '@shared/modules/cache'

@ApiTags('Cache buckets')
@Controller('bucket')
export class CacheBucketController {
  public constructor(
    @Inject(CacheModule.CACHE_SERVICE_TOKEN) private readonly cacheService: CacheService,
  ) {}

  @Get()
  public async getAllBucketIds(): Promise<{
    buckets: string[]
  }> {
    const buckets = await this.cacheService.getAllBucketsIds()

    return {
      buckets,
    }
  }

  @Delete(':ids')
  public async deleteBucketIds(@Param('ids') ids: string): Promise<void> {
    const buckets = ids.split(',')
    await this.cacheService.invalidateBuckets(buckets)
  }
}
