import colors = require('colors/safe')
import { format, transports } from 'winston'
import type { LoggerOptions } from 'winston'

import LogstashTransport = require('winston-logstash/lib/winston-logstash-latest')

import { addColors } from 'winston/lib/winston/config'

import type { TEnvironment } from '@shared/modules/app'
import { LogSeverity, LoggerTransport } from '@shared/modules/app'

const customFormat = format.printf((args) => {
  const { service, level, timestamp, message, traceId } = args
  const logData = {
    level,
    source: colors.yellow(service as string),
    timestamp,
    message,
    traceId: colors.gray(traceId as string),
  }

  return JSON.stringify(logData)
})

const customLevels: { [key in LogSeverity]: number } = {
  [LogSeverity.ERROR]: 0,
  [LogSeverity.WARN]: 1,
  [LogSeverity.INFO]: 2,
  [LogSeverity.HTTP]: 3,
  [LogSeverity.VERBOSE]: 4,
  [LogSeverity.DEBUG]: 5,
  // Custom level
  [LogSeverity.TRACE]: 6,
}

export const initializeDefaultOptions = (
  loggerTransports: TEnvironment['TRANSPORT_LEVELS'],
  MAXIMUM_LOG_LEVEL: LogSeverity,
): LoggerOptions => {
  const desiredTransports = loggerTransports.split(',') as LoggerTransport[]

  const allTransports: LoggerOptions['transports'] = []

  if (
    desiredTransports.includes(LoggerTransport.CONSOLE) ||
    desiredTransports.includes(LoggerTransport.NOTHING)
  ) {
    allTransports.push(
      new transports.Console({
        format: format.combine(
          format.timestamp({ format: 'isoDateTime' }),
          format.json(),
          format.colorize({ all: true }),
        ),
        handleExceptions: true,
        silent: desiredTransports.includes(LoggerTransport.NOTHING),
      }),
    )
  }

  if (desiredTransports.includes(LoggerTransport.FILE)) {
    allTransports.push(
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
    )
  }

  if (desiredTransports.includes(LoggerTransport.LOGSTASH)) {
    allTransports.push(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
      new LogstashTransport({
        port: 5000,
        node_name: 'logstash',
        host: 'logstash',
      }),
    )
  }

  // Add color for custom layer
  addColors({
    [LogSeverity.TRACE]: 'gray',
  })

  return {
    level: MAXIMUM_LOG_LEVEL,
    levels: customLevels,
    format: format.combine(
      format.timestamp({ format: 'isoDateTime' }),
      format.json(),
      customFormat,
    ),
    transports: [...allTransports],
  }
}

export const WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN = Symbol('WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN')
