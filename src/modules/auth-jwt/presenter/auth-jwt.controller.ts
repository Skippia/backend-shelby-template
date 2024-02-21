import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Body,
  Inject,
  UseFilters,
  UseGuards,
  Get,
  Query,
  Redirect,
  UsePipes,
} from '@nestjs/common'

import {
  ApiTags,
  ApiOperation,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiMovedPermanentlyResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger'

import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule'

import { ZodValidationPipe } from '@anatine/zod-nestjs'

import { EXPIRES_IN_AT_MINUTES, EXPIRES_IN_RT_MINUTES } from '@auth-jwt/domain/helpers/constants'
import { JwtCookiesEnum, JwtPayload } from '@auth-jwt/domain/helpers/types'

import { AtGuard, RtGuard } from '@auth-jwt/infrastructure/guards'

import { ExtractRt, GetCurrentUser, logoutFromSystemAsJwt } from '@auth-jwt/infrastructure/helpers'

import {
  UsecasesProxyModule,
  ISignupLocalUsecase,
  IDeleteExpiredRtSessionsUsecase,
  ILoginLocalJwtUsecase,
  ILogoutJwtUsecase,
  IRefreshJwtTokensUsecase,
  ISignupLocalConfirmUsecase,
} from '@auth-jwt/application/usecases'

import { ZodSerializerInterceptor } from '@shared/interceptors'
import { PrismaExceptionFilter } from '@shared/filters'

import { BadContract, NotFoundContract, UnauthorizedContract } from '@shared/swagger/dto'

import { addCookies } from '@shared/helpers/cookies'
import { CronEnum } from '@shared/helpers/types'

import { AppResponse } from '@shared/modules/app'

import {
  AuthSignupLocalContract,
  AuthLoginLocalJwtContract,
  AuthSignupLocalResponseSchema,
  AuthSignupLocalConfirmContract,
} from './dto'

@Controller('auth')
@ApiTags('Authorization JWT')
@UseFilters(PrismaExceptionFilter)
@UsePipes(new ZodValidationPipe())
export class AuthJwtController {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(UsecasesProxyModule.SIGNUP_LOCAL_USECASE)
    private readonly signupLocalUsecase: ISignupLocalUsecase,
    @Inject(UsecasesProxyModule.LOGIN_LOCAL_USECASE)
    private readonly loginLocalJwtUsecase: ILoginLocalJwtUsecase,
    @Inject(UsecasesProxyModule.LOGOUT_USECASE)
    private readonly logoutUsecase: ILogoutJwtUsecase,
    @Inject(UsecasesProxyModule.REFRESH_JWT_TOKENS_USECASE)
    private readonly refreshJwtTokensUsecase: IRefreshJwtTokensUsecase,
    @Inject(UsecasesProxyModule.CONFIRM_EMAIL_REGISTRATION)
    private readonly loginLocalConfirmUsecase: ISignupLocalConfirmUsecase,
    @Inject(UsecasesProxyModule.DELETE_EXPIRED_RT_SESSIONS)
    private readonly deleteExpiredRtSessionsUsecase: IDeleteExpiredRtSessionsUsecase,
  ) {}

  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ description: 'Signup locally' })
  @ApiCreatedResponse({ type: AuthSignupLocalContract.AuthSignupLocalResponse })
  @ApiBadRequestResponse({ type: BadContract.BadRequest })
  @ZodSerializerInterceptor(AuthSignupLocalResponseSchema)
  async signupLocal(
    @Body() dto: AuthSignupLocalContract.AuthSignupLocalRequest,
  ): Promise<AuthSignupLocalContract.AuthSignupLocalResponse> {
    const newUser = await this.signupLocalUsecase.execute(dto)
    return newUser as AuthSignupLocalContract.AuthSignupLocalResponse
  }

  @Get('local/confirm')
  @Redirect('https://docs.nestjs.com/controllers#redirection', 301)
  @HttpCode(HttpStatus.PERMANENT_REDIRECT)
  @ApiOperation({ description: 'Confirm email registration' })
  @ApiMovedPermanentlyResponse()
  @ApiNotFoundResponse({ type: NotFoundContract.NotFoundResponse })
  async signupLocalConfirm(
    @Query() query: AuthSignupLocalConfirmContract.AuthSignupLocalConfirmRequest,
  ): Promise<void> {
    await this.loginLocalConfirmUsecase.execute(query)
  }

  @Post('local/jwt/login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ description: 'Signin locally (JWT)' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  async loginLocalJwt(
    @Res({ passthrough: true }) res: AppResponse,
    @ExtractRt() rt: string,
    @Body() dto: AuthLoginLocalJwtContract.AuthLoginLocalJwtRequest,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.loginLocalJwtUsecase.execute(dto, rt)

    addCookies(res, [
      {
        key: JwtCookiesEnum.ACCESS_TOKEN,
        value: accessToken,
        options: {
          expiresInSecondsOffset: 60 * EXPIRES_IN_AT_MINUTES,
        },
      },
      {
        key: JwtCookiesEnum.REFRESH_TOKEN,
        value: refreshToken,
        options: {
          expiresInSecondsOffset: 60 * EXPIRES_IN_RT_MINUTES,
        },
      },
    ])
  }

  @UseGuards(RtGuard)
  @Post('local/jwt/refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ description: 'Refresh tokens (JWT)' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  async refreshTokens(
    @GetCurrentUser() jwtPayload: JwtPayload,
    @ExtractRt() oldRt: string,
    @Res({ passthrough: true }) res: AppResponse,
  ): Promise<void> {
    const { accessToken, refreshToken: newRefreshToken } =
      await this.refreshJwtTokensUsecase.execute(
        {
          email: jwtPayload.email,
          roles: jwtPayload.roles,
          sub: jwtPayload.sub,
          username: jwtPayload.username,
        },
        oldRt,
      )

    addCookies(res, [
      {
        key: JwtCookiesEnum.ACCESS_TOKEN,
        value: accessToken,
        options: {
          expiresInSecondsOffset: 60 * EXPIRES_IN_AT_MINUTES,
        },
      },
      {
        key: JwtCookiesEnum.REFRESH_TOKEN,
        value: newRefreshToken,
        options: {
          expiresInSecondsOffset: 60 * EXPIRES_IN_RT_MINUTES,
        },
      },
    ])
  }

  @UseGuards(AtGuard)
  @Post('jwt/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ description: 'Logout' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  async logout(
    @ExtractRt() maybeRt: string | undefined,
    @Res({ passthrough: true }) res: AppResponse,
  ): Promise<void> {
    await this.logoutUsecase.execute(maybeRt)

    /**
     * Clear cookies related with JWT tokens
     */
    logoutFromSystemAsJwt(res)
  }

  @Cron(CronExpression.EVERY_5_MINUTES, { name: CronEnum.REMOVE_EXPIRED_RT_SESSIONS })
  async clearExpiredRtSessions(): Promise<void> {
    this.schedulerRegistry.getCronJob(CronEnum.REMOVE_EXPIRED_RT_SESSIONS)

    // Delete all expired RT sessions
    await this.deleteExpiredRtSessionsUsecase.execute()
  }
}
