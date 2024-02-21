import { ConfigService } from '@nestjs/config'
import { MailerModule } from '@nestjs-modules/mailer'
import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import path from 'path'

import { Environment } from '@shared/modules/app'

import { MailService } from './mail.service'

/**
 * We use here dynamic module to be able to inject `DOMAIN_TOKEN`
 * into `MailService` via static field of module itself (MailModule.DOMAIN_TOKEN)
 */
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>(Environment.MAIL_HOST),
          port: config.get<number>(Environment.MAIL_PORT),
          secure: true,
          auth: {
            user: config.get<string>(Environment.MAIL_USER),
            pass: config.get<string>(Environment.MAIL_PASSWORD),
          },
        },
        defaults: {
          from: `"No Reply" <${config.get<string>(Environment.MAIL_FROM)}>`,
        },
        template: {
          dir: path.join(process.cwd(), '/static/templates/'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
})
export class MailModule {
  static MAIL_SERVICE_TOKEN = 'MAIL_SERVICE_TOKEN'
  static DOMAIN_TOKEN = 'DOMAIN_TOKEN'

  static register(): DynamicModule {
    return {
      module: MailModule,
      providers: [
        {
          inject: [ConfigService],
          useFactory: (config: ConfigService): string =>
            config.get<string>(Environment.DOMAIN) as string,
          provide: MailModule.DOMAIN_TOKEN,
        },
        {
          provide: MailModule.MAIL_SERVICE_TOKEN,
          useClass: MailService,
        },
      ],
      exports: [MailModule.MAIL_SERVICE_TOKEN],
    }
  }
}
