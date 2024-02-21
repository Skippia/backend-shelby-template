import PDFDocument from 'pdfkit'
import { Writable } from 'stream'

import { Inject, Injectable } from '@nestjs/common'

import type { UserEntity } from '@auth-jwt/domain/entities'

import type { IPdfGeneratorService } from '@certificate/application/ports'
import { AppOptions } from '@shared/modules/app'

@Injectable()
export class PdfGeneratorService implements IPdfGeneratorService {
  constructor(@Inject('APP_CONFIG') private readonly appOptions: AppOptions) {}

  generatePdfCertificateForUser(userEntity: UserEntity): Promise<Buffer> {
    return new Promise<Buffer>((resolve) => {
      // 1. Create stream
      const chunks: Buffer[] = []
      const writeStream: Writable = new Writable({
        write(chunk: Buffer, encoding, callback): void {
          chunks.push(chunk)
          callback()
        },
      })

      // 2. Create a document
      const doc = new PDFDocument()

      // Pipe its output somewhere, like to a file or HTTP response
      doc.pipe(writeStream)

      const { assetsPrefix } = this.appOptions

      // Embed a font, set the font size, and render some text
      doc
        .font(`${assetsPrefix}/PalatinoBold.ttf`)
        .fontSize(25)
        .text(`Some text with an embedded font! ${JSON.stringify(userEntity)}`, 100, 100)

      // Add an image, constrain it to a given size, and center it vertically and horizontally
      doc.image(`${assetsPrefix}/image.png`, {
        fit: [250, 300],
        align: 'center',
        valign: 'center',
      })

      // Add another page
      doc.addPage().fontSize(25).text('Here is some vector graphics...', 100, 100)

      // Draw a triangle
      doc.save().moveTo(100, 150).lineTo(100, 250).lineTo(200, 250).fill('#FF3300')

      // Apply some transforms and render an SVG path with the 'even-odd' fill rule
      doc
        .scale(0.6)
        .translate(470, -380)
        .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
        .fill('red', 'even-odd')
        .restore()

      // Add some text with annotations
      doc
        .addPage()
        .fillColor('blue')
        .text('Here is a link!', 100, 100)
        .underline(100, 100, 160, 27, { color: '#0000FF' })
        .link(100, 100, 160, 27, 'http://google.com/')

      // Finalize PDF file
      doc.end()

      writeStream.on('finish', () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(pdfBuffer)
      })
    })
  }
}
