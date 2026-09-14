# Immersive Video: AssetBundle file kind, admin Video ID, one object per video, ingest-side integrity

**Status:** accepted; decision 3 (`immersive-videos/<videoId>.<ext>` for every file) and the "ship videos through Unity Addressables" rejection are superseded for bundles by [ADR 0012](./0012-immersive-video-addressables-catalog-on-cdn.md). Raw video still lands on `<videoId>.<ext>`; decisions 1, 2 and 4 stand.

The headset app (`Virtality-app/Virtality`, `Run_Cycle`) plays Immersive Video from Unity AssetBundles built in the editor, one `VideoClip` per bundle. ADR 0010 routed the bytes through CloudFront and the Download Descriptor but assumed raw video files, versioned object keys and a SHA-256 the headset would verify. Four things changed once the bundle workflow was on the table.

## Decision

1. **Two File Kinds; AssetBundle is the default.** The adminboard picker offers **Unity AssetBundle** (`.bundle`) and **raw video** (`mp4, m4v, mov, webm, mkv`). The kind is a picker-side choice: nothing is stored beyond the object key's extension, and the headset branches on that extension (`.bundle` → `AssetBundle.LoadFromFile` → `VideoClip`; else `VideoPlayer.url`). The platform never inspects the file. The server derives the S3 `Content-Type` from the extension (`application/octet-stream` for bundles) instead of trusting the browser, which reports no type for `.bundle`.
2. **The Video ID may be chosen by the admin, once.** `ImmersiveVideo.id` is the `videoId` on every socket event, the object key and the headset filename, so a hand-picked id must be the primary key. The first `upload.start` for a row may carry a `videoId` (`^[a-z0-9][a-z0-9._-]{0,63}$`, unique); the row is renamed before the multipart upload is created. Blank keeps the generated cuid. Once `version ≥ 1` the id is locked: a headset may already hold a file under it.
3. **One object per video: `immersive-videos/<videoId>.<ext>`.** A replace uploads onto the live key; S3 swaps the bytes at `CompleteMultipartUpload`. The `version` column keeps incrementing so the console's "Update available" diff and the headset's resume decision are unchanged. `ImmersiveVideoRetiredObject` and the object sweep are gone; a replace that changes extension deletes the previous key once the new one verifies. A failed republish onto the live key has already destroyed the published bytes, so the row drops to `Unpublished` with no file instead of pretending to be `Published`. Because the URL is now stable, the Download Descriptor appends `?v=<version>` as the CloudFront cache key for that version.
4. **Integrity is settled on ingest and stays platform-side.** Every part is uploaded with `ChecksumAlgorithm: SHA256`, so S3 rejects a part whose bytes differ from what the server sent, and `CompleteMultipartUpload` records a composite checksum. `Verifying` is one `HeadObject` (`ContentLength` equals the size the browser reported, checksum present); the composite checksum is stored on the row as the audit of that check and is the publish precondition. The Download Descriptor no longer carries a checksum; the headset's only check is byte count against `sizeBytes`, reported as `checksum_mismatch` on failure (the reason name is kept to avoid churning the enum, the socket contract and the console copy).

## Rejected alternatives

| Alternative                                                        | Why rejected                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ship videos through Unity Addressables (remote catalog on the CDN) | Addressables packs at editor build time; a video an admin uploads cannot enter a catalog the app was built with, and `DownloadDependenciesAsync` has no pause, `.part` or resume semantics. Loading the downloaded bundle directly with `AssetBundle.LoadFromFile` needs no catalog. |
| A separate `slug` column instead of renaming the primary key       | Every consumer (`videoPlay {videoId}`, `DeviceVideo.videoId`, the manifest, the object key) would need a mapping; the id is the one thing they already share.                                                                                                                        |
| Keep versioned keys                                                | Correct, but it carries the retired-object table and sweep for a v1 with a handful of videos. Deferred, not rejected: the key builder is one function.                                                                                                                               |
| Keep the server SHA-256 read-back                                  | Streams every multi-GB object back through the API for a check S3 already performs per part on the way in.                                                                                                                                                                           |
| CloudFront invalidation on publish                                 | A new AWS dependency and IAM grant for what a query-string cache key gives for free, provided the distribution's cache policy includes `v`.                                                                                                                                          |
| Rename `checksum_mismatch` to `size_mismatch`                      | Touches the Prisma enum, the wire contract, console copy and the VR spec for no behavioural gain.                                                                                                                                                                                    |

## Consequences

- The adminboard "Upload file" row action opens the edit dialog, where the File Kind and Video ID live; only "Resume upload" keeps the bare file input (kind is implied by the `.part` in progress).
- `durationSec` is blank for bundles (the browser cannot probe them); the column renders a dash.
- A bundle built for the wrong Unity version or target uploads and verifies fine and fails only on the headset. Compatibility is the VR team's to keep; the doc asks the headset to report `videoEnded` rather than hang in Starting.
- The distribution's cache policy must forward and key on the `v` query string; until it does, a republish can serve stale bytes for the TTL and the headset reports `checksum_mismatch`.
- Resumed uploads started before this change (parts without checksums) cannot complete and must be aborted and restarted.
- Reintroducing versioned keys is a change to `immersiveVideoObjectKey()` plus a sweep; nothing on the wire moves.

## References

- Predecessors: ADR 0009 (Library Mirror), ADR 0010 (byte path and control path)
- Contract: `docs/architecture/immersive-video-shared-contract.md`; lifecycle: `docs/architecture/immersive-video-lifecycle.md`; headset: `docs/architecture/immersive-video-vr-client.md`
- Domain language: `apps/adminboard/CONTEXT.md` (**File Kind**, **Video ID**, **Video Upload**), `services/server/CONTEXT.md` (**Download Descriptor**)
