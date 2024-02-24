import { generateItemKey } from 'src/modules/bids/bids.types'
import type { TItem } from 'src/modules/bids/bids.types'

import { mockItemId } from 'src/modules/bids'

import type { CacheService } from '@shared/modules/cache'

const generateTomorrowDate = (): string => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

export const itemInputData: TItem = {
  id: mockItemId,
  name: 'Item 1',
  description: 'Item 1 description',
  createdAt: new Date().toISOString(),
  endingAt: generateTomorrowDate(),
  price: 0,
  bids: 0,
  highestBidUserId: '666',
}

export async function createItems(cache: CacheService): Promise<Pick<TItem, 'id'>> {
  await cache.setCache(itemInputData, generateItemKey(itemInputData.id))
  return { id: itemInputData.id }
}
