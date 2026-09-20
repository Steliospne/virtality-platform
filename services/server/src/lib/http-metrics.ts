import type { AppMeter } from '@virtality/shared/observability'

type HttpRequestSample = {
  method: string
  route: string
  statusCode: number
  durationMs: number
}

// Labels stay low-cardinality on purpose: route is the matched pattern, not
// the raw path, and there is no requestId/userId. Anything per-request lives
// in the http.request.completed log line.
export function createHttpMetrics(meter: AppMeter) {
  const requests = meter.createCounter('http.server.requests', {
    description: 'Completed HTTP requests',
    unit: '{request}',
  })
  const duration = meter.createHistogram('http.server.request.duration', {
    description: 'HTTP request duration',
    unit: 's',
    advice: {
      explicitBucketBoundaries: [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
      ],
    },
  })

  return {
    record(sample: HttpRequestSample) {
      const attributes = {
        'http.request.method': sample.method,
        'http.route': sample.route,
        'http.response.status_code': sample.statusCode,
        'http.response.status_class': `${Math.floor(sample.statusCode / 100)}xx`,
      }
      requests.add(1, attributes)
      duration.record(sample.durationMs / 1000, attributes)
    },
  }
}
