# Observability

This repo now has a logs-only observability path built around:

- OpenTelemetry log emission from the Node services and Next server runtimes
- OpenTelemetry Collector as the ingestion boundary
- Loki as the log backend
- Grafana as the query and dashboard UI

Tracing and metrics can later reuse the same OTLP collector entrypoint.

## Local stack

Start the observability stack:

```bash
pnpm observability:up
```

Stop it:

```bash
pnpm observability:down
```

Tail the stack logs:

```bash
pnpm observability:logs
```

Endpoints:

- Grafana: `http://localhost:3005`
- Loki: `http://localhost:3100`
- OTLP gRPC: `http://localhost:4317`
- OTLP HTTP: `http://localhost:4318`
- Collector metrics: `http://localhost:8888/metrics`

Default Grafana credentials:

- user: `admin`
- password: `admin`

## Runtime env vars

Applications can use these env vars without code changes:

- `OTEL_EXPORTER_OTLP_ENDPOINT`: base OTLP endpoint, for example `http://localhost:4318`
- `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: explicit logs endpoint, for example `http://localhost:4318/v1/logs`
- `OTEL_DEPLOYMENT_ENVIRONMENT`: normalized environment label such as `development`, `preview`, or `production`
- `OTEL_LOG_LEVEL`: minimum emitted level, one of `debug`, `info`, `warn`, `error`
- `OTEL_LOGS_ENABLED`: set to `false` to disable OTLP export while keeping structured stdout logs

If no OTLP env var is set, the Node OTEL exporter falls back to the local default `http://localhost:4318/v1/logs`.

## Current log sources

Phase 1 emits structured server-side logs from:

- `services/server`
- `services/socket`
- `apps/console` server actions
- `apps/adminboard` API routes and server actions
- `apps/website` route handlers and server actions

Browser log shipping is intentionally not enabled in this phase. Client-side logs should be added later as explicit, high-value events instead of raw console forwarding.

## Grafana assets

Grafana is provisioned with:

- a default Loki datasource
- a starter dashboard: `Virtality Logging Overview`

The dashboard intentionally starts simple:

- all service logs
- HTTP request logs from `services/server`
- socket room lifecycle logs from `services/socket`

## Suggested LogQL queries

Use these queries in Grafana Explore for the first smoke checks:

```logql
{service_name=~".+"}
```

```logql
{service_name="server"} |= "http.request"
```

```logql
{service_name="socket"} |= "socket.room"
```

```logql
{service_name="console"} |= "bug_report"
```

```logql
{service_name="adminboard"} |= "unauthorized"
```

## Smoke checks

1. Start the observability stack.
2. Start the app processes you care about.
3. Hit one backend HTTP route in `services/server`.
4. Open one socket session and trigger a room join/leave.
5. Trigger one server action, such as the website contact action or a console/adminboard server-side call.
6. Confirm the logs appear in Grafana Explore and on the starter dashboard.

The application-side logger always writes structured stdout lines, so services should keep running even if the collector or Loki is unavailable.

## Production-aware rollout

Production needs two paths:

- Long-running Node services like `services/socket` can export OTLP logs directly to a reachable collector.
- Vercel-hosted runtimes should forward logs through a production ingress path instead of assuming direct access to the local collector.

Recommended production shape:

1. Run an internet-reachable OTEL Collector or gateway in your hosting environment.
2. Point backend services directly at that collector with `OTEL_EXPORTER_OTLP_ENDPOINT`.
3. For Vercel-hosted apps, use a Vercel log drain or a small ingestion endpoint that forwards normalized logs into the collector.
4. Keep the same resource attributes everywhere: `service.name`, `service.namespace`, `service.version`, and `deployment.environment.name`.

That keeps phase 1 logs usable now and avoids reworking naming or ingestion when traces and metrics are added later.

## Logging Contract

The canonical structured logging contract is documented in:

- `infra/docker/observability/logging-spec.md`

Use this document as the implementation guide for any new producers (including Unity) that must integrate with the Grafana/Loki/OTel pipeline.
