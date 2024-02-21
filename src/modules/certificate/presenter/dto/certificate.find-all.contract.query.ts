import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

/**
 * `${ModuleName}${Usecase}Request`
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CertificateFindAllContract {
  /**
   * `${ModuleName}${Usecase}Response`
   */
  export class CertificateFindAllPdfResponse {
    @ApiProperty({ type: 'string', format: 'binary', description: 'File type: pdf' })
    @IsNotEmpty()
    @IsString()
    file: string // Base64-encoded string or binary data
  }

  export class CertificateFindAllZipResponse {
    @ApiProperty({ type: 'string', format: 'binary', description: 'File type: zip' })
    @IsNotEmpty()
    @IsString()
    file: string // Base64-encoded string or binary data
  }
}
