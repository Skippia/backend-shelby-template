import { patchNestjsSwagger } from '@anatine/zod-nestjs'
import type { INestApplication } from '@nestjs/common'
import type { OpenAPIObject } from '@nestjs/swagger'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import path from 'path'
import fs from 'node:fs/promises'

export async function initSwagger(app: INestApplication): Promise<void> {
  const config = new DocumentBuilder()
    .setTitle('Nest monolite template')
    .setDescription('The nest template API')
    .setVersion('1.0.0')
    .build()

  patchNestjsSwagger()

  const document = SwaggerModule.createDocument(app, config)

  await extractDocsJson(document)

  SwaggerModule.setup('docs', app, document)
}

function extractDocsJson(document: OpenAPIObject): Promise<void> {
  return fs.writeFile(path.join(process.cwd(), 'docs', 'swagger.json'), JSON.stringify(document))
}
