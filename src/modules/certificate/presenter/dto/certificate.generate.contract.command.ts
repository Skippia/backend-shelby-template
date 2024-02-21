import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber } from 'class-validator'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CertificateGenerateContract {
  /**
   * `${ModuleName}${Usecase}Request`
   */
  export class CertificateGenerateRequest {
    @ApiProperty({ example: 1, description: "User's id" })
    @IsNumber()
    @IsNotEmpty()
    userId: number
  }
}
