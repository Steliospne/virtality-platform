# Immersive Video: CDN byte path, relay control path, physio-only initiation

**Status:** accepted

Immersive Video files are multi-GB and must reach a paired headset while a physio watches from the console (map: issue #283). Three things had to be routed: the bytes, the commands and reports, and the decision to start. We route each through the component already built for it and add no new long-lived server logic.

## Decision

1. **Bytes: CloudFront → headset, directly.** The headset downloads the object from the CDN (`https://cdn.virtality.app/<objectKey>`, CloudFront in front of S3) over HTTPS, resumable with `Range`. Neither the platform API nor the socket relay ever carries video bytes.
2. **The headset learns where the bytes are from a Download Descriptor**, not from the console. On every `videoDownloadStart` the headset fetches `GET /api/v1/device-videos/:videoId?deviceId=<Headset Identity>` and receives the current verified version, CDN URL, byte size and SHA-256. The socket payload carries `videoId` only; the console never holds a byte-path URL. The endpoint trusts the Headset Identity on the same terms as the Library Mirror write (ADR 0009). Introducing a presigned URL later is a server-only change: the endpoint mints the URL and the headset already re-fetches the descriptor on a CDN 403/410.
3. **Control: the existing Socket.IO relay, in the device room.** Console → VR commands and VR → console reports travel as relay events in the room addressed by Headset Identity. The relay stays a dumb forwarder registered from one `RelayEventMap`; no new server-side state or logic.
4. **Only the physio initiates**, from the console, with the file size visible. No auto-download, no manifest polling, no preload. The single autonomous headset behaviour is finishing a `downloading` `.part` it was already asked for; a `paused` `.part` is never resumed without a console command.

Deferrals that are not decisions of this ADR — public CDN URL in v1, no session tracking in v1 — live in the contract's out-of-scope section.

## Rejected alternatives

| Alternative                                            | Why rejected                                                                                                                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-proxied bytes (`services/server` streams the file) | Multi-GB streams through a single Node process with no CDN caching; Traefik and the process become the bottleneck for every headset at once. CloudFront already serves `206` ranges unchanged. |
| Relay-carried bytes (chunks over Socket.IO)            | Same bottleneck through the socket service, plus a fragile custom resume protocol re-implementing what HTTP `Range` gives for free.                                                            |
| Headset-pulled manifests / auto-download               | Costs the physio the size-aware choice and pulls gigabytes onto headsets nobody asked to fill. The physio drives everything from the console.                                                  |
| URL, size and checksum in the socket payload (#292)    | Ties the wire contract to the URL scheme; a later presigned URL would change headset code. The descriptor keeps the socket payload URL-agnostic and puts refresh on the headset.               |

## Consequences

- `immersiveVideo.list` for the console returns no `url` and no `checksum`; it keeps `sizeBytes` and `version` for the size warning and the "Update available" diff.
- `url_expired` is headset-owned: the console has no URL-retry branch and shows the generic download-failed copy.
- A new failure reason `unavailable` covers a descriptor `404` (video unpublished/deleted, or headset no longer paired).
- The relay registration is one line (`registerRelayEvents(VIDEO_RELAY, roomCode, socket)`) plus a table test; nothing new in the socket glossary.

## References

- Map: [Immersive Video (180° FPV)](https://github.com/Virtality-app/virtality-platform/issues/283); payload decision: [#292](https://github.com/Virtality-app/virtality-platform/issues/292)
- Contract: `docs/architecture/immersive-video-shared-contract.md`; headset requirements: `docs/architecture/immersive-video-vr-client.md`
- Companion: ADR 0009 (Library Mirror trust model)
- Domain language: `services/server/CONTEXT.md` (**Download Descriptor**, **Library Mirror**), `apps/console/CONTEXT.md` (**Download Request**)
