import type { RTSessionEntity, UserEntity } from '../entities'

export type IAuthJwtRepository<TGenericClient> = {
  proxy: TGenericClient
  // Users
  findUserByEmail(email: string): Promise<UserEntity | null>
  findUserByConfirmationToken(token: string): Promise<UserEntity | null>
  findUserById(id: number): Promise<UserEntity | null>
  createUser(user: UserEntity): Promise<UserEntity | null>
  confirmUserRegistration(id: number): Promise<void>
  // RtSessions
  createRtSession(data: RTSessionEntity): Promise<RTSessionEntity | null>
  findRtSessionByRt(rt: string, exp: number): Promise<RTSessionEntity | null>
  updateRtSessionByRt({
    oldRt,
    newRt,
    newExp,
  }: {
    oldRt: string
    newRt: string
    newExp: number
  }): Promise<void>
  deleteRtSessionByRt(rt: string): Promise<void>
  deleteExpiredRtSessions(): Promise<number>
}
