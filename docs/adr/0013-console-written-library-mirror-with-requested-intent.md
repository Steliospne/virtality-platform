# Immersive Video: the console writes the Library Mirror; a Download Request is recorded as `requested`

**Status:** accepted; supersedes ADR 0009 decisions 2, 3 and 5 (headset-written mirror over `PUT /api/v1/device-videos`). Decisions 1 and 4 of ADR 0009 stand: the headset's disk is the source of truth and the mirror is keyed by Headset Identity.

The VR team asked to drop the HTTP report: every fact it carried is already on the socket, and the headset should not need a second channel with its own retry and coalescing rules. The console hears all of those events. The question was whether letting it write the **Library Mirror** reintroduced the drift ADR 0009 rejected a console-written mirror for. It does, in one bounded case, and that case is now accepted and documented rather than avoided.

## Decision

1. **The console is the only writer of the Library Mirror.** It translates the headset's socket events into `deviceVideo.*` writes: `videoLibraryState` replaces the headset's rows (`reportLibraryState`); `videoDownloadAck`, `videoDownloadPaused`, `videoDownloadComplete` and `videoDownloadFailed` patch one row (`applyEvent`); progress is sampled about every 10 s per video. Writes are fire-and-forget; the live view never waits on them. Every write is scoped to a headset bound to a Device the caller owns.
2. **`PUT /api/v1/device-videos` is removed.** The headset's only HTTP call is the Download Descriptor. Nothing in the socket contract changes.
3. **A Download Request is recorded as `requested`.** When the physio clicks Download the console writes a `DeviceVideo` row with status `requested` before the headset answers. `requested` is console intent, not Library State: a full `videoLibraryState` replace keeps `requested` rows the headset does not mention, because the headset cannot report a request it never received. The row leaves `requested` when the headset reports that video in any status, or when the physio cancels. A headset never sends `requested`.
4. **Absent is still "no row".** A `cancelled` failure or a withdrawn request deletes the row; `videoDelete` is reflected by the headset's next `videoLibraryState`. Nothing pre-seeds rows at pairing.
5. **Staleness is accepted, bounded and visible.** If no console is in the room when a download finishes, the mirror stays at the last event the console saw until the next console joins and receives `videoLibraryState`. The offline view already labels rows "as of `reportedAt`". `DeviceVideoReport.freeBytes` is nullable so a `requested` row can precede any headset report.

## Rejected alternatives

| Alternative                                               | Why rejected                                                                                                                                                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep `PUT` (ADR 0009)                                     | The VR team's call: a second channel with its own retry, coalescing and `dirty` flag for facts already on the socket. The only case it covered better is a download finishing with no console present, which decision 5 accepts.                |
| The socket relay writes the mirror                        | One writer that sees every event, but `services/socket` has no database or API client today and would stop being a dumb forwarder. Deferred: if the no-console case turns out to matter, this is the next step and nothing on the wire changes. |
| Pre-seed `absent` rows for every catalog video at pairing | Duplicates what a missing row already means, needs fan-out writes on every publish and delete, and a `DeviceVideoReport` at pairing has no `freeBytes` to report.                                                                               |
| Keep the Download Request client-side only (as before)    | Loses cross-console visibility and any future headset-side pickup of pending requests. `requested` is a tiny, well-bounded addition: one enum value, one rule about full replaces.                                                              |
| Persist every progress tick                               | One write per second per download for a number the offline view only shows coarsely.                                                                                                                                                            |

## Consequences

- Two consoles in the same room write the same facts; the writes are idempotent upserts and last write wins. Order between them does not matter because each carries the headset's absolute state for that row.
- A `requested` row can outlive a headset that never acknowledged it. While online it is overlaid on the live view with a Cancel; offline it reads "Requested · Waiting for the headset". Cancel removes it without waiting for the headset.
- A future headset-side read of pending requests (so a headset can pick up a request made while it was offline) is possible without a schema change; it is not built.
- `services/socket` is untouched. ADR 0009's rejection of a "console-written mirror" stands as history: the mirror is console-written from the headset's own reports, not from the console's commands, which is the distinction that keeps it from drifting on the happy path.

## References

- Supersedes: ADR 0009 (decisions 2, 3, 5)
- Contract: `docs/architecture/immersive-video-shared-contract.md`; lifecycle: `docs/architecture/immersive-video-lifecycle.md` §6; headset: `docs/architecture/immersive-video-vr-client.md` §4
- Code: `packages/orpc/src/procedures/device-video-mirror.ts` (writer rules and tests), `apps/console/hooks/use-headset-library-mirror.ts`
- Domain language: `apps/console/CONTEXT.md` (**Download Request**, **Requested**), `services/server/CONTEXT.md` (**Library Mirror**)
