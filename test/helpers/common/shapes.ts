export const errorShape = expect.objectContaining({
  message: expect.any(String),
  statusCode: expect.any(Number),
  errorName: expect.any(String),
  timestamp: expect.any(String),
  path: expect.any(String),
})

export const sessionShape = expect.objectContaining({
  session: expect.objectContaining({
    cookie: expect.objectContaining({
      expires: expect.any(String),
      httpOnly: expect.any(Boolean),
      originalMaxAge: expect.any(Number),
      path: expect.any(String),
      sameSite: expect.any(String),
      secure: expect.any(Boolean),
    }),
    passport: expect.objectContaining({
      user: expect.objectContaining({
        email: expect.any(String),
        roles: expect.arrayContaining([expect.any(String)]),
      }),
    }),
  }),
})
