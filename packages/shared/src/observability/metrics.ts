import type { Meter } from '@opentelemetry/api'

// Re-exported so services can type meter-taking helpers without depending
// on @opentelemetry/api themselves.
export type AppMeter = Meter
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import {
  AggregationTemporality,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics'

import { createServiceResource, resolveServiceIdentity } from './resource.js'

export type MeterOptions = {
  serviceName: string
  serviceNamespace?: string
  serviceVersion?: string
}

type MetricsRuntime = {
  provider?: MeterProvider
  meter: Meter
}

declare global {
  var __virtalityMetricsRuntime__: Map<string, MetricsRuntime> | undefined
}

const DEFAULT_EXPORT_INTERVAL_MS = 15_000

function getRuntimeRegistry() {
  globalThis.__virtalityMetricsRuntime__ ??= new Map()
  return globalThis.__virtalityMetricsRuntime__
}

function resolveExportIntervalMs() {
  const raw = process.env.OTEL_METRIC_EXPORT_INTERVAL
  const parsed = raw ? Number(raw) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_EXPORT_INTERVAL_MS
}

function getRuntime(options: MeterOptions): MetricsRuntime {
  const identity = resolveServiceIdentity(options)
  const cacheKey = `${identity.serviceNamespace}:${identity.serviceName}:${identity.deploymentEnvironment}`

  const registry = getRuntimeRegistry()
  const existing = registry.get(cacheKey)
  if (existing) return existing

  // Metrics go to the same OTLP endpoint as logs (…/v1/metrics); the
  // collector remote-writes them to Prometheus. Nothing is scraped.
  const shouldEnable = process.env.OTEL_METRICS_ENABLED !== 'false'

  let provider: MeterProvider | undefined

  if (shouldEnable) {
    provider = new MeterProvider({
      resource: createServiceResource(identity),
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            // Prometheus remote write needs cumulative counters.
            temporalityPreference: AggregationTemporality.CUMULATIVE,
          }),
          exportIntervalMillis: resolveExportIntervalMs(),
        }),
      ],
    })
  }

  const meter = provider
    ? provider.getMeter(identity.serviceName, identity.serviceVersion)
    : // No provider → the API's no-op meter; instruments still exist so
      // call sites need no branching.
      new MeterProvider().getMeter(identity.serviceName)

  const runtime: MetricsRuntime = { provider, meter }
  registry.set(cacheKey, runtime)
  return runtime
}

export function createAppMeter(options: MeterOptions): AppMeter {
  return getRuntime(options).meter
}

export async function shutdownMetrics() {
  const registry = getRuntimeRegistry()

  await Promise.all(
    [...registry.values()].map(async (runtime) => {
      if (!runtime.provider) return
      // Flush the last interval so a shutdown does not lose the final samples.
      await runtime.provider.shutdown()
    }),
  )
}
