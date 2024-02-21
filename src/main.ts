/* eslint-disable import/first */
/* eslint-disable import/no-commonjs */
// eslint-disable-next-line import/no-unassigned-import
require('module-alias/register')

import { ScheduleModule } from '@nestjs/schedule'

import { AuthJwtModulePiece } from '@auth-jwt/auth-jwt-piece.module'

import { AuthSessionModulePiece } from '@auth-session/auth-session-piece.module'

import { CertificateModulePiece } from '@certificate/certificate-piece.module'

import { MailModule } from '@shared/modules/mail/infrasructure/adapters/mail'

import { AppModule } from './shared/modules/app/app.module'

import { PrismaModule } from './shared/modules/prisma/client'

AppModule.bootstrap({
  instance: '[Backend Nestjs]',
  imports: [
    /** Database */
    PrismaModule.register(),
    /** Scheduler */
    ScheduleModule.forRoot(),
    /* Email */
    MailModule.register(),
    /* Elasticsearch */
    // SearchModule,
    /* Auth JWT*/
    AuthJwtModulePiece,
    /* Auth Session*/
    AuthSessionModulePiece,
    /* Certificates */
    CertificateModulePiece,
  ],
  cors: {
    // TODO: should be gotten from env
    whitelist: new Set(['localhost:3000', 'localhost:5000']),
  },
}).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
})
