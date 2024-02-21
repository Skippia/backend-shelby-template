import type { UserEntity } from '@auth-session/domain'
import type { AppRequest } from '@shared/modules/app'

export function saveUserInSession(req: AppRequest, user: UserEntity): void {
  // @ts-expect-error ...
  req.session.user = user
}
