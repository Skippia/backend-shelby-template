import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber } from 'class-validator'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CertificateDeleteByIdContract {
  /**
   * `${ModuleName}${Usecase}Request`
   */
  export class CertificateDeleteByIdResponse {
    @ApiProperty({ example: 1, description: "User's id of deleted certificate" })
    @IsNumber()
    @IsNotEmpty()
    userId: number
  }
}
