# Metrics Specification (Prometheus via OTel)

Companion to `logging-spec.md`. Logs answer "what happened to this request/room"; metrics answer "how much, how fast, how often" cheaply and independently of log level or volume.

## Path

Applications push OTLP metrics to the **same collector endpoint as logs** (`OTEL_EXPORTER_OTLP_ENDPOINT`, `/v1/metrics`). The collector remote-writes to Prometheus; Grafana queries the `prometheus` datasource. Nothing is scraped from the apps.

- `createAppMeter({ serviceName })` in `@virtality/shared/observability` returns an OTel `Meter` bound to the same resource as the logger.
- Cumulative temporality, exported every 15 s (`OTEL_METRIC_EXPORT_INTERVAL` ms to change).
- `OTEL_METRICS_ENABLED=false` disables export; instruments then no-op.
- `shutdownObservability()` flushes the last interval.

## Naming

- OTel names are dot-separated (`http.server.requests`); Prometheus renders them snake_case with the unit appended: `http_server_requests_total`, `http_server_request_duration_seconds_bucket`.
- Always set `unit`: `s` for durations, `{request}` / `{room}` style annotations for counts.
- Prefix by service domain: `http.server.*` (server), `socket.*` (socket).

## Labels

Resource attributes become labels on every series, matching the Loki stream labels: `service_name`, `service_namespace`, `service_version`, `deployment_environment_name`.

Instrument attributes must be **bounded enums**. Allowed today:

| Attribute                                                  | Values                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `http.request.method`                                      | HTTP method                                                                                                            |
| `http.route`                                               | matched route pattern (`/api/v1/devices/:deviceId`), never the raw path                                                |
| `http.response.status_code` / `http.response.status_class` | `200` / `2xx`                                                                                                          |
| `event` (socket)                                           | `role_slot_joined`, `complete`, `deleted`, `cleaned`, `role_slot_cleared`, `stale_disconnect_ignored`, `peer_replaced` |
| `role`                                                     | `console`, `vr`                                                                                                        |
| `reason`                                                   | registry eviction / rejection reason enums                                                                             |
| `outcome`                                                  | relay: `forwarded`, `blocked`, `stale_peer_blocked`, `unknown_event`; connection: `open`, `closed`, `rejected`         |
| `eventName`                                                | relayed socket event name (fixed relay table)                                                                          |

Never label by `requestId`, `userId`, `roomCode`, `socketId`, `deviceId`, raw path or user agent. Those stay in logs.

## Instruments

| Metric (Prometheus name)               | Type                            | Owner  | Labels                                   |
| -------------------------------------- | ------------------------------- | ------ | ---------------------------------------- |
| `http_server_requests_total`           | counter                         | server | method, route, status_code, status_class |
| `http_server_request_duration_seconds` | histogram (5 ms – 10 s buckets) | server | method, route, status_code, status_class |
| `socket_rooms_active`                  | gauge                           | socket | —                                        |
| `socket_room_events_total`             | counter                         | socket | event, role, reason                      |
| `socket_relay_messages_total`          | counter                         | socket | eventName, outcome                       |
| `socket_connections_total`             | counter                         | socket | outcome, reason                          |

## Example queries

```promql
# request rate by route, production
sum by (http_route) (rate(http_server_requests_total{service_name="server", deployment_environment_name="production"}[5m]))

# 5xx ratio
sum(rate(http_server_requests_total{http_response_status_class="5xx"}[5m])) / sum(rate(http_server_requests_total[5m]))

# p95 latency
histogram_quantile(0.95, sum by (le) (rate(http_server_request_duration_seconds_bucket{service_name="server"}[5m])))

# rooms paired per hour
sum(increase(socket_room_events_total{event="complete"}[1h]))
```

## Related

- `logging-spec.md`
- infra repo: `observability/README.md`, `observability/prometheus/`, `observability/otel-collector/config.yaml`
