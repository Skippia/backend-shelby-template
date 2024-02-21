import type { INestApplication } from '@nestjs/common'

import request from 'supertest'
import type { App } from 'supertest/types'

import { AppModule } from '@shared/modules/app/app.module'
import { APP_DEFAULT_OPTIONS } from '@shared/modules/app'

const _GP = APP_DEFAULT_OPTIONS.globalPrefix

describe('AppController (e2e)', () => {
  let app: INestApplication
  let httpServer: App

  beforeAll(async () => {
    app = await AppModule.bootstrap({
      disableAll: true,
      forceEnabled: {
        disableHealthcheckStatus: false,
        disableLogs: false,
      },
    })

    httpServer = app.getHttpServer() as App
  })

  afterAll(async () => {
    await app.close()
  })

  it('Check healthcheck of server (GET)', () => request(httpServer).get(`/${_GP}`).expect(204))
})
