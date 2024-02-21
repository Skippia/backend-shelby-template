import type { INestApplication, ModuleMetadata } from '@nestjs/common'

import type { TDisableBootOptions } from '@shared/modules/app'

import { AppModule } from '@shared/modules/app/app.module'

export async function initApp({
  imports,
  disableOptions = {},
  typeRunning = 'bootstrap',
}: {
  imports?: ModuleMetadata['imports']
  disableOptions?: TDisableBootOptions
  typeRunning?: 'bootstrap' | 'compile'
} = {}): Promise<INestApplication> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-param-reassign
  typeRunning ||= 'bootstrap'

  if (typeRunning === 'compile') {
    return await AppModule.compile({
      imports,
      disableAll: true,
      forceEnabled: {
        disableFilter: false,
        disableLogs: false,
        ...disableOptions,
      },
    })
  }

  return await AppModule.bootstrap({
    imports,
    disableAll: true,
    forceEnabled: {
      disableFilter: false,
      disableLogs: false,
      ...disableOptions,
    },
  })
}
