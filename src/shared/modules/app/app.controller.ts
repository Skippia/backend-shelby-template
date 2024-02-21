/* eslint-disable @typescript-eslint/no-empty-function */
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'

import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { AppService } from './app.service'
import { AppStatus } from './app.types'
import { AppStatusSchemaResponse } from './app.dto'

@ApiTags('Healthcheck')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    description: 'Just get info that the application is up and running',
  })
  @ApiNoContentResponse()
  get(): void {}

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Get info about working application',
  })
  @ApiOkResponse({
    type: AppStatusSchemaResponse,
  })
  getStatus(): AppStatus {
    return this.appService.getStatus()
  }
}
