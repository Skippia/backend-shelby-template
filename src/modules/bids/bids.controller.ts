/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @darraghor/nestjs-typed/api-method-should-specify-api-response */
/* eslint-disable @darraghor/nestjs-typed/controllers-should-supply-api-tags */
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'

import { BidService } from './bids.service'
import type { TItem } from './bids.types'
import { TCreateBid } from './bids.types'

@Controller('bids')
export class BidController {
  constructor(private readonly bidService: BidService) {}
  /**
   * Make a bid for specific item (without locking the item)
   */
  @Post('make-no-lock')
  @HttpCode(HttpStatus.OK)
  async createBidNoLock(@Body() newBid: TCreateBid): Promise<TItem> {
    /**
     * Simplification:
     * in real workflow we likely:
     *  - extract userId from JWT token or session
     *  - extract itemId from @Param('itemId')
     */

    const updatedItem = await this.bidService.createBidWithoutLock({ ...newBid })

    return updatedItem
  }

  /**
   * Make a bid for specific item (with watch + transaction)
   */
  @Post('make-watch-transaction')
  @HttpCode(HttpStatus.OK)
  async createBidWatchTransaction(@Body() newBid: TCreateBid): Promise<TItem> {
    /**
     * Simplification:
     * in real workflow we likely:
     *  - extract userId from JWT token or session
     *  - extract itemId from @Param('itemId')
     */

    const updatedItem = await this.bidService.createBidWithWatchTransaction({ ...newBid })

    return updatedItem
  }

  /**
   * Make a bid for specific item with custom lock
   */
  @Post('make1')
  @HttpCode(HttpStatus.OK)
  async createBid1(@Body() newBid: TCreateBid): Promise<TItem> {
    /**
     * Simplification:
     * in real workflow we likely:
     *  - extract userId from JWT token or session
     *  - extract itemId from @Param('itemId')
     */

    const updatedItem = await this.bidService.createBidWithCustomLock({ ...newBid })

    return updatedItem
  }

  /**
   * Make a bid for specific item with Redlock lock
   */
  @Post('make2')
  @HttpCode(HttpStatus.OK)
  async createBid2(@Body() newBid: TCreateBid): Promise<TItem> {
    /**
     * Simplification:
     * in real workflow we likely:
     *  - extract userId from JWT token or session
     *  - extract itemId from @Param('itemId')
     */

    const updatedItem = await this.bidService.createBidWithRedlock({ ...newBid })

    return updatedItem
  }
}
