import { MailerService } from '@nestjs-modules/mailer'
import { Inject, Injectable } from '@nestjs/common'

import path from 'path'

import { AppOptions } from '@shared/modules/app'

import { ILoggerService, InjectLogger } from '@shared/modules/logger'

import type { IMailService } from '@shared/modules/mail/application/ports'

import { MailModule } from './mail.module'

@Injectable()
export class MailService implements IMailService {
  constructor(
    private mailerService: MailerService,
    @Inject(MailModule.DOMAIN_TOKEN) private domain: string,
    @InjectLogger(MailService.name)
    readonly logger: ILoggerService,
    @Inject('APP_CONFIG') private readonly appOptions: AppOptions,
  ) {}

  async sendSignupConfirmation(
    userEmailInfo: { username: string; email: string },
    token: string,
  ): Promise<void> {
    this.logger.log(`try to send email with confirmation to ${userEmailInfo.email}...`)

    await this.mailerService.sendMail({
      to: userEmailInfo.email,
      subject: 'Welcome to `Nest.js monolite template` application! Confirm your Email',
      template: path.join(process.cwd(), '/static/templates/confirmation'),
      context: {
        username: userEmailInfo.username,
        url: `${this.domain}/${this.appOptions.globalPrefix}/auth/local/confirm?token=${token}`,
      },
    })
  }
}
