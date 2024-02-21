import type { AppRequest, AppResponse } from '@shared/modules/app'

export const logoutFromSystemAsSession = (req: AppRequest, res: AppResponse): void => {
  // 1. Clear cookie
  res.clearCookie('session_id')
  // 2. Remove session from Redis
  req.logout((err) => {
    req.session.destroy((_err) => {
      res.status(204).send()
    })
  })
}
