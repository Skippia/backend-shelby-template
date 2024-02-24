import { Module } from '@nestjs/common'

import { BidController } from './bids.controller'
import { BidService } from './bids.service'

@Module({
  providers: [BidService],
  controllers: [BidController],
})
export class BidsModule {}
