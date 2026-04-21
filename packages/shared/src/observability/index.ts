import { SeverityNumber } from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type PrimitiveLogValue = boolean | number | string

export type LogAttributes = Record<string, unknown>

export type LoggerOptions = {
  serviceName: string
  serviceNamespace?: string
  serviceVersion?: string
  defaultAttributes?: LogAttributes
}

type LoggerMethod = (
  event: string,
  attributes?: LogAttributes,
  message?: string,
) => void

export type AppLogger = {
  debug: LoggerMethod
  info: LoggerMethod
  warn: LoggerMethod
  error: LoggerMethod
  child: (attributes: LogAttributes) => AppLogger
}

type RuntimeState = {
  provider?: LoggerProvider
  otelLogger?: ReturnType<LoggerProvider['getLogger']>
  logLevel: LogLevel
  serviceName: string
  serviceNamespace: string
  serviceVersion: string
  deploymentEnvironment: string
}

declare global {
  var __virtalityObservabilityRuntime__: Map<string, RuntimeState> | undefined
}

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']

const DEFAULT_SERVICE_NAMESPACE = 'virtality'
const DEFAULT_LOG_LEVEL: LogLevel = 'info'

function getRuntimeRegistry() {
  globalThis.__virtalityObservabilityRuntime__ ??= new Map()
  return globalThis.__virtalityObservabilityRuntime__
}

function resolveLogLevel(value?: string): LogLevel {
  if (!value) return DEFAULT_LOG_LEVEL

  const normalized = value.trim().toLowerCase()
  return LOG_LEVELS.includes(normalized as LogLevel)
    ? (normalized as LogLevel)
    : DEFAULT_LOG_LEVEL
}

function getDeploymentEnvironment() {
  return (
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT ??
    process.env.ENV ??
    process.env.NODE_ENV ??
    'development'
  )
}

function shouldEmit(level: LogLevel, minLevel: LogLevel) {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(minLevel)
}

function normalizeAttributeValue(
  value: unknown,
): PrimitiveLogValue | PrimitiveLogValue[] | undefined {
  if (value === undefined) return undefined
  if (value === null) return 'null'
  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value
  }

  if (value instanceof Error) {
    return JSON.stringify({
      name: value.name,
      message: value.message,
      stack: value.stack,
    })
  }

  if (Array.isArray(value)) {
    if (
      value.every(
        (item) =>
          typeof item === 'boolean' ||
          typeof item === 'number' ||
          typeof item === 'string',
      )
    ) {
      return value as PrimitiveLogValue[]
    }

    return JSON.stringify(value)
  }

  return JSON.stringify(value)
}

function normalizeAttributes(attributes: LogAttributes = {}) {
  const normalized: Record<string, PrimitiveLogValue | PrimitiveLogValue[]> = {}

  for (const [key, value] of Object.entries(attributes)) {
    const normalizedValue = normalizeAttributeValue(value)
    if (normalizedValue !== undefined) {
      normalized[key] = normalizedValue
    }
  }

  return normalized
}

function getRuntimeState(options: LoggerOptions): RuntimeState {
  const serviceNamespace = options.serviceNamespace ?? DEFAULT_SERVICE_NAMESPACE
  const serviceVersion =
    options.serviceVersion ?? process.env.npm_package_version ?? '0.0.0'
  const deploymentEnvironment = getDeploymentEnvironment()
  const cacheKey = `${serviceNamespace}:${options.serviceName}:${deploymentEnvironment}`

  const registry = getRuntimeRegistry()
  const existing = registry.get(cacheKey)

  if (existing) {
    return existing
  }

  const logLevel = resolveLogLevel(process.env.OTEL_LOG_LEVEL)
  const shouldEnableOtel = process.env.OTEL_LOGS_ENABLED !== 'false'
  const resource = resourceFromAttributes({
    'service.name': options.serviceName,
    'service.namespace': serviceNamespace,
    'service.version': serviceVersion,
    'deployment.environment.name': deploymentEnvironment,
  })

  let provider: LoggerProvider | undefined
  let otelLogger: ReturnType<LoggerProvider['getLogger']> | undefined

  if (shouldEnableOtel) {
    provider = new LoggerProvider({
      resource,
      processors: [new BatchLogRecordProcessor(new OTLPLogExporter())],
    })
    otelLogger = provider.getLogger(options.serviceName, serviceVersion)
  }

  const runtimeState: RuntimeState = {
    provider,
    otelLogger,
    logLevel,
    serviceName: options.serviceName,
    serviceNamespace,
    serviceVersion,
    deploymentEnvironment,
  }

  registry.set(cacheKey, runtimeState)
  return runtimeState
}

function writeStdoutLog(
  runtime: RuntimeState,
  level: LogLevel,
  event: string,
  message: string | undefined,
  attributes: LogAttributes,
) {
  const payload = {
    ...attributes,
    ts: new Date().toISOString(),
    level,
    event,
    message: message ?? event,
    'service.name': runtime.serviceName,
    'service.namespace': runtime.serviceNamespace,
    'service.version': runtime.serviceVersion,
    'deployment.environment.name': runtime.deploymentEnvironment,
  }

  const line = JSON.stringify(payload)

  switch (level) {
    case 'debug':
      console.debug(line)
      break
    case 'info':
      console.info(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'error':
      console.error(line)
      break
  }
}

function emitOtelLog(
  runtime: RuntimeState,
  level: LogLevel,
  event: string,
  message: string | undefined,
  attributes: Record<string, PrimitiveLogValue | PrimitiveLogValue[]>,
) {
  if (!runtime.otelLogger) return

  const severityMap: Record<LogLevel, SeverityNumber> = {
    debug: SeverityNumber.DEBUG,
    info: SeverityNumber.INFO,
    warn: SeverityNumber.WARN,
    error: SeverityNumber.ERROR,
  }

  runtime.otelLogger.emit({
    severityNumber: severityMap[level],
    severityText: level.toUpperCase(),
    body: message ?? event,
    timestamp: Date.now(),
    attributes: {
      ...attributes,
      event,
    },
  })
}

function buildLogger(
  runtime: RuntimeState,
  defaultAttributes: LogAttributes = {},
): AppLogger {
  const emit = (
    level: LogLevel,
    event: string,
    attributes: LogAttributes = {},
    message?: string,
  ) => {
    if (!shouldEmit(level, runtime.logLevel)) {
      return
    }

    const mergedAttributes = {
      ...defaultAttributes,
      ...attributes,
    }

    const normalizedAttributes = normalizeAttributes(mergedAttributes)

    writeStdoutLog(runtime, level, event, message, normalizedAttributes)
    emitOtelLog(runtime, level, event, message, normalizedAttributes)
  }

  return {
    debug: (event, attributes, message) =>
      emit('debug', event, attributes, message),
    info: (event, attributes, message) =>
      emit('info', event, attributes, message),
    warn: (event, attributes, message) =>
      emit('warn', event, attributes, message),
    error: (event, attributes, message) =>
      emit('error', event, attributes, message),
    child: (attributes) =>
      buildLogger(runtime, {
        ...defaultAttributes,
        ...attributes,
      }),
  }
}

export function createAppLogger(options: LoggerOptions): AppLogger {
  const runtime = getRuntimeState(options)
  return buildLogger(runtime, options.defaultAttributes)
}

export async function shutdownObservability() {
  const registry = getRuntimeRegistry()

  await Promise.all(
    [...registry.values()].map(async (runtime) => {
      if (!runtime.provider) return
      await runtime.provider.shutdown()
    }),
  )
}

export function createRequestId() {
  return crypto.randomUUID()
}

export const OBSERVABILITY_ENV_KEYS = {
  deploymentEnvironment: 'OTEL_DEPLOYMENT_ENVIRONMENT',
  logLevel: 'OTEL_LOG_LEVEL',
  logsEnabled: 'OTEL_LOGS_ENABLED',
  otlpEndpoint: 'OTEL_EXPORTER_OTLP_ENDPOINT',
  otlpLogsEndpoint: 'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
} as const
