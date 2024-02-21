export enum LogSeverity {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  // Not using
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export enum LoggerTransport {
  'LOGSTASH' = 'LOGSTASH',
  'FILE' = 'FILE',
  'ONLY_CONSOLE' = 'ONLY_CONSOLE',
  'NOTHING' = 'NOTHING',
}

export enum EnvironmentMode {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

export type TEnvironment = {
  // General
  PORT: number
  HOSTNAME: string
  NODE_ENV: EnvironmentMode
  DOMAIN: string
  CORS_WHITELIST: string
  // Logger
  TRANSPORT_LEVEL: LoggerTransport
  SILENT_FILTER_ERRORS: boolean
  MAXIMUM_LOG_LEVEL: LogSeverity
  // Databases
  DB_URI: string
  ELASTICSEARCH_NODE: string
  ELASTICSEARCH_USERNAME: string
  ELASTICSEARCH_PASSWORD: string
  // JWT
  RT_SECRET: string
  AT_SECRET: string
  // MAIL
  MAIL_HOST: string
  MAIL_USER: string
  MAIL_PORT: number
  MAIL_PASSWORD: string
  MAIL_FROM: string
  MAIL_TRANSPORT: string
  // Redis
  REDIS_HOST: string
  REDIS_PORT: number
  SESSION_SECRET: string
}

export const Environment: { [K in keyof TEnvironment]: K } = {
  // General
  PORT: 'PORT',
  HOSTNAME: 'HOSTNAME',
  NODE_ENV: 'NODE_ENV',
  DOMAIN: 'DOMAIN',
  CORS_WHITELIST: 'CORS_WHITELIST',
  // Logger
  TRANSPORT_LEVEL: 'TRANSPORT_LEVEL',
  SILENT_FILTER_ERRORS: 'SILENT_FILTER_ERRORS',
  MAXIMUM_LOG_LEVEL: 'MAXIMUM_LOG_LEVEL',
  // Databases
  DB_URI: 'DB_URI',
  ELASTICSEARCH_NODE: 'ELASTICSEARCH_NODE',
  ELASTICSEARCH_USERNAME: 'ELASTICSEARCH_USERNAME',
  ELASTICSEARCH_PASSWORD: 'ELASTICSEARCH_PASSWORD',
  // JWT
  RT_SECRET: 'RT_SECRET',
  AT_SECRET: 'AT_SECRET',
  // MAIL
  MAIL_HOST: 'MAIL_HOST',
  MAIL_USER: 'MAIL_USER',
  MAIL_PORT: 'MAIL_PORT',
  MAIL_PASSWORD: 'MAIL_PASSWORD',
  MAIL_FROM: 'MAIL_FROM',
  MAIL_TRANSPORT: 'MAIL_TRANSPORT',
  REDIS_HOST: 'REDIS_HOST',
  REDIS_PORT: 'REDIS_PORT',
  SESSION_SECRET: 'SESSION_SECRET',
} as const

export enum AppMetric {
  HTTP_REQUEST_DURATION = 'http_request_duration_seconds',
}

export enum AppTraffic {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum AppMemoryKey {
  OPEN_API_SPECIFICATION = 'OPEN_API_SPECIFICATION',
}
