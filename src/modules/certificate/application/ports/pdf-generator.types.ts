import type { UserEntity } from '@auth-jwt/domain/entities'

export type IPdfGeneratorService = {
  generatePdfCertificateForUser(userEntity: UserEntity): Promise<Buffer>
}
