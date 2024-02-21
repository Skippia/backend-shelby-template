import colors = require('colors/safe')
import { format, transports } from 'winston'
import type { LoggerOptions } from 'winston'

import LogstashTransport = require('winston-logstash/lib/winston-logstash-latest')

import { addColors } from 'winston/lib/winston/config'

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
  loggerTransport: LoggerTransport,
  MAXIMUM_LOG_LEVEL: LogSeverity,
): LoggerOptions => {
  let additionalTransport: LoggerOptions['transports']

  if (loggerTransport === LoggerTransport.LOGSTASH) {
    additionalTransport = [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      new LogstashTransport({
        port: 5000,
        node_name: 'logstash',
        host: 'logstash',
      }),
    ]
  } else if (loggerTransport === LoggerTransport.FILE) {
    additionalTransport = [
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
    ]
  } else {
    additionalTransport = []
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
    transports: [
      new transports.Console({
        format: format.combine(
          format.timestamp({ format: 'isoDateTime' }),
          format.json(),
          format.colorize({ all: true }),
        ),
        handleExceptions: true,
        silent: loggerTransport === LoggerTransport.NOTHING,
      }),
      ...additionalTransport,
    ],
  }
}

export const WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN = Symbol('WINSTON_LOGGER_CONFIG_OPTIONS_TOKEN')
