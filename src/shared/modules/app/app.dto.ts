import { createZodDto } from '@anatine/zod-nestjs'
import { extendApi } from '@anatine/zod-openapi'
import { z } from 'zod'

const AppStatusSystemSchema = z.object({
  version: extendApi(z.string(), {}),
  type: extendApi(z.string(), {}),
  release: extendApi(z.string(), {}),
  architecture: extendApi(z.string(), {}),
  endianness: extendApi(z.string(), {}),
  uptime: extendApi(z.number(), {}),
})

const AppStatusMemorySchema = z.object({
  total: extendApi(z.number(), {}),
  free: extendApi(z.number(), {}),
})

const AppStatusCpuTimesSchema = z.object({
  user: extendApi(z.number(), {}),
  nice: extendApi(z.number(), {}),
  sys: extendApi(z.number(), {}),
  idle: extendApi(z.number(), {}),
  irq: extendApi(z.number(), {}),
})

const AppStatusCpuSchema = z.object({
  model: extendApi(z.string(), {}),
  speed: extendApi(z.number(), {}),
  times: AppStatusCpuTimesSchema,
})

const AppStatusNetworkSchema = z.object({
  interfaces: extendApi(z.record(z.array(z.object({}))), {}),
})

export const AppStatusSchema = extendApi(
  z.object({
    system: AppStatusSystemSchema,
    cpus: extendApi(z.array(AppStatusCpuSchema), {}),
    memory: AppStatusMemorySchema,
    network: AppStatusNetworkSchema,
  }),
)

export class AppStatusSchemaResponse extends createZodDto(AppStatusSchema) {}
