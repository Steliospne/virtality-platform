# Immersive Video: Addressables catalog served from the CDN, bundles keep their Unity filename

**Status:** accepted; supersedes the "ship videos through Unity Addressables" rejection in ADR 0011 and its `<videoId>.bundle` object key.

The headset app (`Virtality-app/Virtality`, `Run_Cycle`) loads Immersive Video through Unity Addressables with a remote catalog, and the VR side leads. Addressables resolves every file by the name Unity wrote relative to one `Remote.LoadPath`, so the platform's job is to host that file tree, not to reshape it.

## Decision

1. **`https://cdn.virtality.app/immersive-videos` is the headset's `Remote.LoadPath`.** The existing prefix is reused; nothing moves. Every Immersive Video object and the catalog pair live flat under it (thumbnails stay in `immersive-videos/<id>/`).
2. **A bundle keeps the filename Unity generated.** `startImmersiveVideoUpload` stores a `.bundle` at `immersive-videos/<unity filename>`; only raw video is still renamed to `<videoId>.<ext>`. The row's Video ID must equal the video's Addressables address, which is what `videoDownloadStart {videoId}` already carries. A republish lands on the new hashed filename and verify deletes the previous key, exactly as an extension change did before.
3. **The catalog pair is uploaded through the same adminboard page, with no database row.** `catalog_<ts>.bin|json` and `catalog_<ts>.hash` must share a stem; the catalog is written first and the `.hash` last with `Cache-Control: no-cache`, because the `.hash` is the only mutable pointer headsets poll and CloudFront would otherwise hold it for the default TTL. Catalog and bundle names are unique per build, so default caching is correct for them. The list the admin sees is read from S3.
4. **The rest of the flow is untouched.** Multipart upload, ingest integrity, publish states, the Download Descriptor and the socket contract keep working; the descriptor URL now names the hashed filename. Whether the headset uses the descriptor or the catalog is the VR team's call.

## Rejected alternatives

| Alternative                                              | Why rejected                                                                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A fresh `addressables/[BuildTarget]/` prefix             | Correct in principle, but it is a second tree to manage and the VR team had already configured `immersive-videos`; add it when a second target exists. |
| Parse the catalog to validate it names published bundles | The default catalog is binary (`.bin`); parsing Unity's format is not worth owning. Ordering (bundles first, then catalog) is a documented admin rule. |
| A `CatalogRelease` table                                 | Nothing needs it yet; S3 already knows which pairs exist and which `.hash` is newest.                                                                  |
| Keep renaming bundles to `<videoId>.bundle`              | Breaks catalog resolution on the headset; this is the 403 that started the work.                                                                       |

## Consequences

- `docs/architecture/immersive-video-vr-client.md` §2 (`{videoId}.bundle` filename from the descriptor URL) is stale for bundles; the headset's own filename convention is now Addressables' cache, not ours.
- An admin who uploads a catalog before the bundles it names leaves headsets with 403s on those bundles until they are published.
- Old catalog pairs accumulate; a sweep is a later concern.
