import { Module } from '@nestjs/common'

import { PdfGeneratorService } from './pdf-generator.service'

@Module({
  providers: [
    {
      provide: PdfGeneratorModule.PDF_SERVICE_TOKEN,
      useClass: PdfGeneratorService,
    },
  ],
  exports: [PdfGeneratorModule.PDF_SERVICE_TOKEN],
})
export class PdfGeneratorModule {
  static PDF_SERVICE_TOKEN = 'PDF_SERVICE_TOKEN'
}
