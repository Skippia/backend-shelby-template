import type { AppResponse } from '@shared/modules/app'

export type TCookie = {
  key: string
  value: string
  options: {
    secure?: boolean
    expiresInSecondsOffset: number
    httpOnly?: boolean
    sameSite?: boolean | 'none' | 'lax' | 'strict'
  }
}
export function addCookie(res: AppResponse, cookie: TCookie): void {
  res.cookie(cookie.key, cookie.value, {
    httpOnly: cookie.options.httpOnly ?? true,
    secure: cookie.options.secure ?? true,
    sameSite: cookie.options.sameSite ?? 'none',
    // It requires miliseconds -> multiply by 1000
    expires: new Date(Date.now() + 1000 * (cookie.options.expiresInSecondsOffset || 0)),
  })
}

export function addCookies(res: AppResponse, cookies: Array<TCookie>): void {
  cookies.forEach((cookie) => addCookie(res, cookie))
}
