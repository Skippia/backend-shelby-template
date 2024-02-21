/* eslint-disable @darraghor/nestjs-typed/api-method-should-specify-api-response */
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Body,
  Get,
  Inject,
  UseFilters,
  UseGuards,
  UsePipes,
  Req,
} from '@nestjs/common'

import {
  ApiTags,
  ApiOperation,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { ZodValidationPipe } from '@anatine/zod-nestjs'

import { SessionRedisGuard, SessionRedisLoginGuard } from '@auth-session/infrastructure/guards'

import {
  ILoginSessionUsecase,
  ILogoutSessionUsecase,
  UsecasesProxyModule,
} from '@auth-session/application/usecases'

import { PrismaExceptionFilter } from '@shared/filters'

import { UnauthorizedContract } from '@shared/swagger/dto'

import { AppRequest, AppResponse } from '@shared/modules/app'

import { logoutFromSystemAsSession } from '@auth-session/infrastructure/helpers'

@Controller('auth/session')
@ApiTags('Authorization Session')
@UseFilters(PrismaExceptionFilter)
@UsePipes(new ZodValidationPipe())
export class AuthSessionController {
  constructor(
    @Inject(UsecasesProxyModule.LOGOUT_SESSION_USECASE)
    private readonly logoutSessionUsecase: ILogoutSessionUsecase,
  ) {}

  @UseGuards(SessionRedisLoginGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Signin locally (session)' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  loginLocal(@Req() req: AppRequest): { email: string } {
    // @ts-expect-error
    return { email: req.session.passport.user.email }
  }

  @UseGuards(SessionRedisGuard)
  @Post('logout')
  @ApiOperation({ description: 'Logout (session)' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  logout(@Req() req: AppRequest, @Res() res: AppResponse): void {
    this.logoutSessionUsecase.execute()

    logoutFromSystemAsSession(req, res)
  }

  @UseGuards(SessionRedisGuard)
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'Just test (session)' })
  test(@Req() req: AppRequest): { message: string } {
    return {
      // @ts-expect-error
      session: req.session,
    }
  }
}
