/**
 * Anemic model
 */
export class RTSessionEntity {
  id: number | null
  rt: string
  rtExpDate: Date
  userAgent: string | null
  updatedAt: Date | null
  createdAt: Date | null
  userId: number

  constructor({
    id,
    rt,
    rtExpDate,
    userAgent,
    updatedAt,
    createdAt,
    userId,
  }: {
    id: number | null
    rt: string
    rtExpDate: Date
    userAgent: string | null
    updatedAt: Date | null
    createdAt: Date | null
    userId: number
  }) {
    this.id = id
    this.rt = rt
    this.rtExpDate = rtExpDate
    this.userAgent = userAgent
    this.updatedAt = updatedAt
    this.createdAt = createdAt
    this.userId = userId
  }
}
