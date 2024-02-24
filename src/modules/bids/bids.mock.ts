import type { TCreateBid } from './bids.types'

export const mockUserId = '1'
export const mockItemId = '666'

export const mockMakeBids1: TCreateBid[] = [
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 10,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 11,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 12,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 13,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 14,
  },
]

export const mockMakeBids2: TCreateBid[] = [
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 14,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 13,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 12,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 11,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 10,
  },
]

export const mockMakeBids3: TCreateBid[] = [
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 12,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 13,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 14,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 11,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 10,
  },
]

export const mockMakeBids4: TCreateBid[] = [
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 11,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 10,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 12,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 13,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 14,
  },
]

export const mockMakeBids5: TCreateBid[] = [
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 10,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 13,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 11,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 14,
  },
  {
    userId: mockUserId,
    itemId: mockItemId,
    price: 12,
  },
]

export const findMaxPriceBid = (bids: TCreateBid[]): TCreateBid =>
  bids.reduce((prev, curr) => (prev.price > curr.price ? prev : curr))

export const mockMakeBidsSet = [
  mockMakeBids1,
  mockMakeBids2,
  mockMakeBids3,
  mockMakeBids4,
  mockMakeBids5,
]
