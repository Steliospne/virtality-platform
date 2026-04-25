# Logging Specification (Grafana/Loki/OTel)

## Purpose

This document defines the log contract for Virtality services and Unity clients so all logs can be queried consistently in Grafana and Loki through OpenTelemetry.

Goals:

- Keep one log shape across backend services and Unity runtimes.
- Preserve machine-readable fields for filtering, alerting, and dashboards.
- Keep event naming predictable so cross-service investigations are easy.

## Observability Path

The expected ingestion path is:

1. Application emits structured logs (JSON-compatible fields).
2. OpenTelemetry SDK/exporter sends logs via OTLP.
3. OpenTelemetry Collector receives and forwards logs to Loki.
4. Grafana queries Loki with LogQL.

Local defaults already used in this repository:

- OTLP HTTP endpoint: `http://localhost:4318/v1/logs`
- OTLP base endpoint: `http://localhost:4318`
- Loki endpoint: `http://localhost:3100`
- Grafana endpoint: `http://localhost:3005`

## Canonical Log Record Schema

Every emitted log record MUST include these fields.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ts` | string (ISO-8601 UTC) | yes | Event timestamp, for example `2026-04-25T18:58:00.000Z`. |
| `level` | enum | yes | One of `debug`, `info`, `warn`, `error`. |
| `event` | string | yes | Stable event identifier (see naming rules). |
| `message` | string | yes | Human-readable short message; defaults to `event` if not provided. |
| `service.name` | string | yes | Logical producer name (for example `server`, `socket`, `adminboard`, `website`, `console`, `unity-client`). |
| `service.namespace` | string | yes | Namespace, default `virtality`. |
| `service.version` | string | yes | Producer version (application build or package version). |
| `deployment.environment.name` | string | yes | Environment label, for example `development`, `preview`, `production`. |

Additional fields are strongly recommended when relevant:

- `component`: subsystem in a service, for example `http`, `device-event-controller`, `networking`.
- `runtime`: runtime type, for example `hono`, `socket.io`, `nextjs-server`, `unity`.
- Correlation fields: `requestId`, `sessionId`, `roomCode`, `userId`, `deviceId`, `traceId`, `spanId`.

## Field Naming Rules

- Use `camelCase` for custom attributes (`durationMs`, `statusCode`, `activeRoomCount`).
- Use OpenTelemetry semantic resource keys with dots (`service.name`, `deployment.environment.name`).
- Keep keys stable; never rename keys without a migration plan.
- Prefer primitive values (`string`, `number`, `boolean`) or arrays of primitives.
- For complex objects, flatten key fields when possible instead of embedding large nested objects.

## Event Naming Convention

Event names MUST follow:

`<domain>.<subject>.<action>[.<outcome>]`

Examples already in this codebase:

- `http.request.completed`
- `http.request.failed`
- `service.start`
- `service.shutdown`
- `socket.connection.open`
- `socket.room.joined`
- `adminboard.patients.list.unauthorized`
- `website.contact_submit.requested`

Rules:

- Event names are lowercase and dot-separated.
- Event names are immutable IDs; do not include dynamic values in the name.
- Dynamic context belongs in attributes (`roomCode`, `statusCode`, `errorCode`).
- Use explicit outcome suffixes for critical paths: `completed`, `failed`, `rejected`, `unauthorized`.

## Severity Level Guidance

- `debug`: high-volume diagnostic detail for development/troubleshooting.
- `info`: expected lifecycle and business flow milestones.
- `warn`: unexpected but handled states (validation issues, unauthorized attempts, retries).
- `error`: operation failed or system health is degraded.

Do not use `error` for expected control flow.

## Error Logging Contract

For all failure paths:

- Use `level=error`.
- Keep `event` action-specific (for example `unity.telemetry.export.failed`).
- Include error metadata fields:
  - `errorName`
  - `errorMessage`
  - `errorStack` (if available)
  - `errorCode` (if available)

Avoid logging raw exception objects as the only context. Emit normalized fields so Loki queries remain simple.

## Correlation and Traceability

To support cross-system debugging, propagate and log correlation IDs:

- HTTP/API: `requestId` (propagated via `x-request-id` where available).
- Multiplayer/session flows: `roomCode`, `sessionId`, `socketId` (backend) and Unity equivalents.
- User/device context: `userId`, `deviceId` when safe to log.
- Distributed tracing (when enabled): `traceId`, `spanId`.

At least one correlation identifier SHOULD be present for every log outside startup/shutdown events.

## Unity Producer Requirements

Unity logging implementation SHOULD:

1. Emit records that conform to the canonical schema.
2. Set resource attributes:
   - `service.name=unity-client` (or another agreed stable name)
   - `service.namespace=virtality`
   - `service.version=<unity build/app version>`
   - `deployment.environment.name=<environment>`
3. Export via OTLP HTTP to `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` when configured.
4. Buffer and batch logs to avoid per-event network calls.
5. Fail open: if OTLP export is unavailable, application flow must continue.
6. Redact or exclude sensitive data before emission.

Recommended Unity default attributes:

- `runtime=unity`
- `platform` (for example `windows`, `macos`, `android`, `quest`)
- `buildType` (for example `debug`, `release`)
- `appMode` (for example `vr`, `simulator`)

## Data Safety and Privacy

Never log:

- Access tokens, refresh tokens, API keys, passwords.
- Full PII payloads unless explicitly approved.
- Large binary payloads.

When user context is required, prefer stable IDs over personal details.

## Example Log Records

Backend-style success event:

```json
{
  "ts": "2026-04-25T18:58:00.000Z",
  "level": "info",
  "event": "http.request.completed",
  "message": "http.request.completed",
  "service.name": "server",
  "service.namespace": "virtality",
  "service.version": "1.2.3",
  "deployment.environment.name": "preview",
  "component": "http",
  "requestId": "615a8ca2-2d0a-4bcf-bd5f-b0284ce13ec5",
  "method": "GET",
  "path": "/api/v1/devices/abc",
  "statusCode": 200,
  "durationMs": 41
}
```

Unity-style failure event:

```json
{
  "ts": "2026-04-25T18:58:03.102Z",
  "level": "error",
  "event": "unity.telemetry.export.failed",
  "message": "OTLP export request failed",
  "service.name": "unity-client",
  "service.namespace": "virtality",
  "service.version": "0.19.0",
  "deployment.environment.name": "development",
  "runtime": "unity",
  "platform": "quest",
  "sessionId": "session-7f2d",
  "errorName": "HttpRequestException",
  "errorMessage": "Connection refused",
  "retryCount": 3
}
```

## Appendix: Unity C# Pseudocode

This is intentionally pseudocode (not drop-in production code) to show the expected mapping and exporter flow.

```csharp
using OpenTelemetry;
using OpenTelemetry.Logs;
using OpenTelemetry.Resources;

public static class UnityObservability
{
    private static ILogger _logger;
    private static readonly Dictionary<string, object> _defaultAttrs = new()
    {
        ["runtime"] = "unity",
        ["platform"] = UnityEngine.Application.platform.ToString().ToLowerInvariant(),
        ["buildType"] = UnityEngine.Debug.isDebugBuild ? "debug" : "release",
        ["appMode"] = "vr"
    };

    public static void Init(string environment, string serviceVersion)
    {
        // Prefer explicit logs endpoint; fallback to OTLP base endpoint.
        var logsEndpoint = Env("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT", "http://localhost:4318/v1/logs");
        var serviceName = Env("OTEL_SERVICE_NAME", "unity-client");
        var serviceNamespace = Env("OTEL_SERVICE_NAMESPACE", "virtality");

        var loggerFactory = LoggerFactory.Create(builder =>
        {
            builder.AddOpenTelemetry(options =>
            {
                options
                    .SetResourceBuilder(ResourceBuilder.CreateDefault().AddAttributes(new Dictionary<string, object>
                    {
                        ["service.name"] = serviceName,
                        ["service.namespace"] = serviceNamespace,
                        ["service.version"] = serviceVersion,
                        ["deployment.environment.name"] = environment
                    }))
                    .AddOtlpExporter(otlp =>
                    {
                        otlp.Endpoint = new Uri(logsEndpoint);
                        otlp.Protocol = OtlpExportProtocol.HttpProtobuf;
                    });
            });
        });

        _logger = loggerFactory.CreateLogger("unity");
    }

    public static void Log(
        string level,
        string @event,
        Dictionary<string, object> attrs,
        string message = null)
    {
        var all = Merge(_defaultAttrs, attrs);

        // Contract-level fields expected in Loki/Grafana queries.
        all["ts"] = DateTime.UtcNow.ToString("O");
        all["level"] = level;                 // debug|info|warn|error
        all["event"] = @event;                // <domain>.<subject>.<action>[.<outcome>]
        all["message"] = message ?? @event;

        // Example correlation keys when available:
        // requestId, sessionId, roomCode, userId, deviceId, traceId, spanId

        switch (level)
        {
            case "debug": _logger.LogDebug("{@attrs}", all); break;
            case "info":  _logger.LogInformation("{@attrs}", all); break;
            case "warn":  _logger.LogWarning("{@attrs}", all); break;
            case "error": _logger.LogError("{@attrs}", all); break;
            default:      _logger.LogInformation("{@attrs}", all); break;
        }
    }

    public static void LogError(string @event, Exception ex, Dictionary<string, object> attrs)
    {
        var all = Merge(new Dictionary<string, object>
        {
            ["errorName"] = ex.GetType().Name,
            ["errorMessage"] = ex.Message,
            ["errorStack"] = ex.StackTrace ?? ""
        }, attrs);

        Log("error", @event, all, "Operation failed");
    }

    // helpers: Env(), Merge() omitted for brevity
}
```

Minimal usage example:

```csharp
UnityObservability.Init(environment: "preview", serviceVersion: Application.version);

UnityObservability.Log("info", "unity.session.joined", new Dictionary<string, object>
{
    ["sessionId"] = sessionId,
    ["roomCode"] = roomCode,
    ["component"] = "networking"
});

try
{
    SendBufferedLogs();
}
catch (Exception ex)
{
    UnityObservability.LogError("unity.telemetry.export.failed", ex, new Dictionary<string, object>
    {
        ["retryCount"] = retryCount,
        ["sessionId"] = sessionId
    });
}
```

## Validation Checklist (Definition of Done)

Unity observability work is considered complete when:

- Logs are visible in Grafana Explore using `{service_name="unity-client"}`.
- Required schema fields exist for all emitted records.
- Event names follow the defined naming convention.
- `requestId` or another correlation field exists on operational events.
- Error logs include normalized error fields.
- No secrets or disallowed PII are present in sampled logs.

## Related Docs

- `infra/docker/observability/observability.md`
