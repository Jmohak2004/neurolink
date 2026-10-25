[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / ensureTelemetry

# Function: ensureTelemetry()

> **ensureTelemetry**(`config?`): `void`

## Parameters

### config?

[`ObservabilityConfig`](../type-aliases/ObservabilityConfig.md)

{ObservabilityConfig | undefined} - Observability options, honoured only when this is the first call.

## Returns

`void`

Nothing; a failed setup is logged and recorded in `getLangfuseHealthStatus`.

## Description

Starts NeuroLink's tracing once per process, synchronously. Every span created through the shared tracers calls it first once this module is loaded, as the main, server and livekit entries do, so direct provider calls without a NeuroLink instance are traced too. Langfuse is enabled unless `config.langfuse` is `false` or has `enabled: false`, when `config.langfuse` is `true` or an options object, or when `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are set and `LANGFUSE_ENABLED` is not `false`, `0`, `off` or `no`; an OTLP exporter is added when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. When the host already registered a TracerProvider no provider is created and `OTEL_EXPORTER_OTLP_ENDPOINT` is ignored with a warning; the Langfuse exporter, if configured, is registered on the shared exporter registry and the host adds `createExporterSpanProcessor()` to its provider. The first call that finds tracing configured decides the setup and a later `config` is ignored, with a warning naming the options that differ from the first when it does differ; calls made before anything is configured start nothing, so a later config or environment can still start tracing, unless `langfuse: false` was passed. Langfuse enabled without both keys (in config or the environment) exports nothing to Langfuse, and a warning says so once. With `langfuse: true` or the environment alone that counts as not configured, so only an OTLP endpoint starts tracing; an options object starts tracing anyway, as it always did, so exporters registered on the shared registry receive the spans. Pending spans and metrics are flushed when the process runs out of work (`beforeExit`), within the same budget as `flushOpenTelemetry`, which an explicit `process.exit()` skips; `NEUROLINK_TELEMETRY_EXIT_FLUSH` set to `false`, `0`, `off` or `no` skips that flush too, and the process ends as soon as it has no work. After `shutdownOpenTelemetry` it does nothing.
