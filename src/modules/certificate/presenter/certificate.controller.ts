import type { StreamableFile } from '@nestjs/common'
import {
  Controller,
  UseFilters,
  Inject,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  UseInterceptors,
  UseGuards,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common'

import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiProduces,
  ApiExtraModels,
  refs,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger'

import { ACGuard, UseRoles } from 'nest-access-control'

import { AtGuard } from '@auth-jwt/infrastructure/guards'

import { GetCurrentUserId } from '@auth-jwt/infrastructure/helpers'

import type { JwtPayload } from '@auth-jwt/domain/helpers/types'

import {
  IDeleteCertificateUsecase,
  IFindAllCertificatesUsecase,
  IFindOwnCertificatesUsecase,
  IGenerateSertificateUsecase,
  UsecasesProxyModule,
} from '@certificate/application/usecases'

import { PrismaExceptionFilter } from '@shared/filters'

import { ForbiddenContract, NotFoundContract, UnauthorizedContract } from '@shared/swagger/dto'

import { ResourceEnum } from '@shared/rbac'

import { Cache } from '@shared/modules/cache'

import {
  CertificateDeleteByIdContract,
  CertificateFindAllContract,
  CertificateGenerateContract,
} from './dto'
import { TransformInStreamableFileInterceptorAsPdfOrZip } from './interceptors'

@Controller('certificate')
@ApiTags('Certificate')
@UseFilters(PrismaExceptionFilter)
@UsePipes(new ValidationPipe())
export class CertificateController {
  constructor(
    @Inject(UsecasesProxyModule.FIND_ALL_CERTIFICATES_USECASE)
    private readonly findAllCertificatesUsecase: IFindAllCertificatesUsecase,
    @Inject(UsecasesProxyModule.GENERATE_CERTIFICATE_USECASE)
    private readonly generateCertificateUsecase: IGenerateSertificateUsecase,
    @Inject(UsecasesProxyModule.FIND_OWN_CERTIFICATES_USECASE)
    private readonly findOwnCertificatesUsecase: IFindOwnCertificatesUsecase,
    @Inject(UsecasesProxyModule.DELETE_CERTIFICATES_USECASE)
    private readonly deleteCertificateUsecase: IDeleteCertificateUsecase,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AtGuard, ACGuard)
  @UseRoles({
    resource: ResourceEnum.CERTIFICATE,
    action: 'create',
    possession: 'any',
  })
  @ApiOperation({ description: 'Generate PDF certificate for any user (admin only)' })
  @ApiCreatedResponse()
  @ApiNotFoundResponse({ type: NotFoundContract.NotFoundResponse })
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  @ApiForbiddenResponse({ type: ForbiddenContract.ForbiddenRequest })
  @Cache({
    invalidate: ({ req }) => [`user-id-${(req.user as JwtPayload).sub}`],
  })
  async generateCertificate(
    @Body() dto: CertificateGenerateContract.CertificateGenerateRequest,
  ): Promise<void> {
    await this.generateCertificateUsecase.execute(dto)
  }

  @Post('generate/own')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AtGuard, ACGuard)
  @UseRoles({
    resource: ResourceEnum.CERTIFICATE,
    action: 'create',
    possession: 'own',
  })
  @ApiOperation({ description: 'Generate PDF certificate (for user himself)' })
  @ApiCreatedResponse()
  @ApiNotFoundResponse({ type: NotFoundContract.NotFoundResponse })
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  @Cache({
    invalidate: ({ req }) => [`user-id-${(req.user as JwtPayload).sub}`],
  })
  async generateOwnCertificate(@GetCurrentUserId() userId: number): Promise<void> {
    await this.generateCertificateUsecase.execute({ userId })
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AtGuard, ACGuard)
  @UseRoles({
    resource: ResourceEnum.CERTIFICATE,
    action: 'read',
    possession: 'any',
  })
  @ApiOperation({ description: 'Find all certificates (admin only)' })
  @ApiExtraModels(
    CertificateFindAllContract.CertificateFindAllPdfResponse,
    CertificateFindAllContract.CertificateFindAllZipResponse,
  )
  @ApiOkResponse({
    schema: {
      anyOf: refs(
        CertificateFindAllContract.CertificateFindAllPdfResponse,
        CertificateFindAllContract.CertificateFindAllZipResponse,
      ),
    },
  })
  @ApiProduces('application/pdf')
  @ApiProduces('application/zip')
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  @ApiForbiddenResponse({ type: ForbiddenContract.ForbiddenRequest })
  @Cache({
    buckets: () => 'all-certificates',
    uniqueSuffix: 'same',
    serializable: false,
  })
  @UseInterceptors(TransformInStreamableFileInterceptorAsPdfOrZip)
  async findAllCertificate(): Promise<StreamableFile | []> {
    const files = await this.findAllCertificatesUsecase.execute()
    /**
     * Files will be converted to StreamableFile
     * via TransformInStreamableFileInterceptor
     */
    return files as StreamableFile | []
  }

  @Get('own')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AtGuard, ACGuard)
  @UseRoles({
    resource: ResourceEnum.CERTIFICATE,
    action: 'read',
    possession: 'own',
  })
  @ApiOperation({ description: 'Find own certificates' })
  @ApiExtraModels(
    CertificateFindAllContract.CertificateFindAllPdfResponse,
    CertificateFindAllContract.CertificateFindAllZipResponse,
  )
  @ApiOkResponse({
    schema: {
      anyOf: refs(
        CertificateFindAllContract.CertificateFindAllPdfResponse,
        CertificateFindAllContract.CertificateFindAllZipResponse,
      ),
    },
  })
  @ApiProduces('application/pdf')
  @ApiProduces('application/zip')
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  @Cache({
    buckets: ({ req }) => `user-id-${(req.user as JwtPayload).sub}`,
    uniqueSuffix: 'same',
    serializable: false,
  })
  @UseInterceptors(TransformInStreamableFileInterceptorAsPdfOrZip)
  async findOwnCertificates(@GetCurrentUserId() userId: number): Promise<StreamableFile | []> {
    const files = await this.findOwnCertificatesUsecase.execute(userId)

    /**
     * Files will be converted to StreamableFile
     * via TransformInStreamableFileInterceptor
     */
    return files as StreamableFile | []
  }

  @Delete(':certificateId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: CertificateDeleteByIdContract.CertificateDeleteByIdResponse,
  })
  @UseGuards(AtGuard, ACGuard)
  @UseRoles({
    resource: ResourceEnum.CERTIFICATE,
    action: 'delete',
    possession: 'any',
  })
  @ApiOperation({ description: 'Delete PDF certificate for any user (admin only)' })
  @ApiNotFoundResponse({ type: NotFoundContract.NotFoundResponse })
  @ApiUnauthorizedResponse({ type: UnauthorizedContract.UnauthorizedRequest })
  @ApiForbiddenResponse({ type: ForbiddenContract.ForbiddenRequest })
  @Cache<{ userId: number }>({
    invalidate: ({ data }) => [`user-id-${data.userId}`, 'all-certificates'],
    serializable: false,
  })
  async deleteCertificate(
    @Param('certificateId', ParseIntPipe) certificateId: number,
  ): Promise<{ userId: number }> {
    const { userId } = await this.deleteCertificateUsecase.execute(certificateId)

    return { userId }
  }
}
