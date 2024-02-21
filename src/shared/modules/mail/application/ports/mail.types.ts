export type IMailService = {
  sendSignupConfirmation(
    userEmailInfo: { username: string; email: string },
    token: string,
  ): Promise<void>
}
