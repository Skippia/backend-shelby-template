import type { ISO8601Date } from '@shared/helpers/types'

export type TItem = {
  id: string
  name: string
  description: string
  createdAt: ISO8601Date
  endingAt: ISO8601Date
  price: number
  bids: number
  highestBidUserId: string
}

export type TBid = {
  itemId: string
  userId: string
  price: number
  createdAt?: ISO8601Date
}

export type TCreateBid = Pick<TBid, 'itemId' | 'userId' | 'price'> & {
  createdAt?: Date
}

export const generateItemKey = (itemId: string): string => `#items${itemId}`
export const generateBidKey = (bidId: string): string => `#bids${bidId}`
