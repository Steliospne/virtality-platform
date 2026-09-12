# Immersive Video — VR Client Requirements (Step 8)

**Status:** Accepted (VR team sign-off pending; changes return as a new ticket); companion to `immersive-video-shared-contract.md` (wire contract) and `immersive-video-lifecycle.md` (state machines). Decisions recorded in [ADR 0009](../adr/0009-headset-owned-video-library-mirror.md) and [ADR 0010](../adr/0010-immersive-video-cdn-byte-path-relay-control-path.md).  
**Applies to:** VR headset app (Unity)  
**Scope:** Everything the headset must implement for the 180° FPV video mode. Event names, payload types, and status values are defined in the shared contract and are not repeated here beyond what is needed to read this document. Items marked **(open)** are decisions the VR team owns.

## 0. Principles the headset must respect

- **The physio drives everything from the console.** The headset never starts a download on its own; the one exception is finishing a `downloading` `.part` it was already asked for.
- **No headset UI** beyond a passive progress indicator. No menus, dialogs, confirmations, or error text on the headset. Every error travels to the console as an event.
- **The headset's disk is the source of truth.** It reports Library State live over the socket and durably to the API; it never reads the catalog. The only thing it fetches from the API is the **Download Descriptor** for a video the console asked it to download.
- **Downloads never block a session.** A regular program must launch and run normally while a download is in flight.

## 1. Socket: `VIDEO_RELAY`

Same relay, room (`roomCode = deviceId`, the **Headset Identity**) and role (`vr`) as programs. Handle the console → VR events and emit the VR → console ones.

| Receive                                        | Do                                                                                                                                                                                                                                                                              | Reply                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `videoLibraryStateRequest`                     | Read manifest + free space.                                                                                                                                                                                                                                                     | `videoLibraryState` within 2 s                                                                                                            |
| `videoDownloadStart {videoId}`                 | Reply ack, enqueue (§3). The worker fetches the Download Descriptor (§3.2 step 0). `paused` at the descriptor's version → resume. `ready` at that version → no I/O. Different version → discard any `.part`, start fresh. Descriptor 404 → `videoDownloadFailed {unavailable}`. | `videoDownloadAck` immediately on receipt, before the descriptor fetch or any I/O; `videoDownloadComplete` immediately if already `ready` |
| `videoDownloadPause {videoId}`                 | Abort the transfer within 1 s, keep `.part`, manifest `paused`. If queued, remove from queue and mark `paused` with `bytesDownloaded: 0`.                                                                                                                                       | `videoDownloadPaused {videoId, bytesDownloaded}`                                                                                          |
| `videoDownloadCancel {videoId}`                | Abort if running, dequeue if queued, delete `.part` whatever the state, manifest entry removed.                                                                                                                                                                                 | `videoDownloadFailed {cancelled}`                                                                                                         |
| `videoDelete {videoId}`                        | If this video is playing, stop playback first (**open**: or refuse). Delete the final file, `.part`, manifest entry.                                                                                                                                                            | `videoLibraryState`                                                                                                                       |
| `videoPlay {videoId}`                          | Open the player, start from 0.                                                                                                                                                                                                                                                  | `videoPlayAck`, then `videoPlaybackProgress` 1/s                                                                                          |
| `videoPause` / `videoResume` / `videoRecenter` | Control the player.                                                                                                                                                                                                                                                             | `videoPlaybackProgress` keeps emitting 1/s with `paused: true` / `false`; none for recenter                                               |
| `videoStop`                                    | Stop, return to idle scene.                                                                                                                                                                                                                                                     | `videoEnded`                                                                                                                              |

Unsolicited emits:

- `videoLibraryState` on every `roomComplete` where a console is present (covers every reconnect, wake, and relaunch).
- `videoDownloadProgress` ≤ 1/s per video while a download is running, including `stalled: true` ticks while retrying.
- Unknown `video*` events must be ignored, not crash the app; the console may ship newer events first.

A socket disconnect must never abort a download or stop playback.

## 2. Local storage and manifest

- Directory `<persistentDataPath>/videos/`. Files: `{videoId}.{ext}` (final; `ext` taken from the Download Descriptor URL — the catalog accepts `mp4, m4v, mov, webm, mkv` and applies no encoding constraint), `{videoId}.part` (in progress or paused).
- `videos/manifest.json` is the on-disk source of truth. One entry per video:

  ```json
  {
    "videos": {
      "<videoId>": {
        "status": "downloading | paused | ready | failed",
        "version": 3,
        "sizeBytes": 4831838208,
        "checksum": "sha256 hex",
        "url": "https://cdn.virtality.app/immersive-videos/<id>/v3.mp4",
        "reason": "insufficient_storage | network | checksum_mismatch | url_expired | unavailable"
      }
    }
  }
  ```

  The Download Descriptor (`version`, `sizeBytes`, `checksum`, `url`) is stored so a silent resume after wake or relaunch needs neither the console nor the API.

- Write the manifest atomically (temp file → rename) on every transition.
- **Reconcile on launch and on wake:** `ready` with no final file → entry removed; `.part` with no entry → deleted; `downloading` → resume (§3.4); `paused` → left alone.
- `freeBytes` = free space on the volume holding `videos/`, refreshed for every `videoLibraryState` and API report.
- `bytesDownloaded` for `downloading`/`paused` = current `.part` size.

## 3. Download engine

### 3.1 Queue

Single worker, FIFO. Queued entries report `downloading` with `bytesDownloaded: 0` and no progress ticks until they start. Pause/Cancel apply to queued entries too.

### 3.2 One download, start to finish

0. **Descriptor:** `GET {apiBase}/api/v1/device-videos/{videoId}?deviceId={Headset Identity}`. `200` → store `{version, url, sizeBytes, checksum}` in the manifest. `404` (any `error`) → `videoDownloadFailed {unavailable}`, discard any `.part`, done. `5xx` / no answer → treat as transient loss (§3.3): entry stays `downloading`, `stalled: true` ticks, retry with backoff. Runs on every `videoDownloadStart`, including resume-from-`paused` and already-`ready`; **not** on wake/relaunch resumes (§3.4 uses the stored descriptor).
1. **Free-space precheck:** `freeBytes − (sizeBytes − partSize) > margin` (**open**: margin, suggested 500 MB). Otherwise `videoDownloadFailed {insufficient_storage}` immediately, `.part` discarded.
2. **Resume decision:** `.part` exists **and** manifest `version == descriptor version` → re-hash the existing prefix sequentially to prime the SHA-256, then `offset = partSize`. Otherwise delete the `.part`, `offset = 0`.
3. **Request:** `GET url` with `Range: bytes={offset}-` when `offset > 0`. Expect `206` — CloudFront forwards `Range` to S3 and this is verified on the live distribution. Keep a defensive branch for a `200` to a ranged request (truncate the `.part`, reset the hash, consume from 0) but do not treat it as an expected path. Also verify `Content-Length`/`Content-Range` against `sizeBytes`; a mismatch is `checksum_mismatch` territory — discard and fail.
4. **Stream:** append chunks to the `.part`; feed every chunk to the incremental hash; never hold the file in memory. Runs on a background thread; must not touch the render loop.
5. **Progress:** `videoDownloadProgress {bytesDownloaded, sizeBytes, stalled: false}` ≤ 1/s.
6. **Finish:** on EOF compare hash with `checksum`. Match → rename `.part` → `{videoId}.{ext}` atomically, manifest `ready`, `videoDownloadComplete {videoId, version}`. Mismatch → delete `.part`, `videoDownloadFailed {checksum_mismatch}`.
7. **Report** (§4.3) at start, pause, completion, failure.

### 3.3 Transient loss is not failure

Any transport-level error — DNS, connect timeout, reset, read timeout, wifi gone — keeps the entry `downloading`:

- Retry with exponential backoff `1, 2, 4 … 30 s` (cap) **indefinitely while the app runs**. Cost is one small request per 30 s.
- While retrying and a console is in the room, emit `videoDownloadProgress {stalled: true}` at the same 1/s cadence.
- On success, run the resume decision (§3.2 step 2) again — the `.part` may have grown — and continue.

`videoDownloadFailed {network}` is reserved for non-recoverable errors: HTTP 4xx other than 403/410, disk I/O errors, permission errors. Discard the `.part` for these. HTTP 403/410 → re-fetch the descriptor once (step 0). Same version → resume the `.part` with the new `url`. New version → discard the `.part`, restart from step 1. Still 403/410 → `videoDownloadFailed {url_expired}`, keep the `.part`.

### 3.4 Sleep, wake, relaunch

- `OnApplicationPause(true)` / `OnApplicationQuit`: cancel the stream cleanly, flush the `.part` and the manifest. Nothing else.
- `OnApplicationPause(false)` and cold launch: reconcile (§2), then for every `downloading` entry run §3.2 from step 2 **silently** — no console command is needed, this is finishing a request the physio already made. Then §4 report, then rejoin the room (which triggers the unsolicited `videoLibraryState`).
- A `paused` entry is **never** resumed by launch or wake. Only a `videoDownloadStart` resumes it. This is the only behavioural difference between the two statuses and it is exactly the physio's intent.

### 3.5 Pause and cancel

- `videoDownloadPause`: abort the request via its cancellation token (≤ 1 s), flush, manifest `paused`, reply `videoDownloadPaused`. If the entry was only queued, mark it `paused` with `bytesDownloaded: 0`.
- `videoDownloadCancel`: same abort, then delete the `.part` and the entry. Reply `videoDownloadFailed {cancelled}`.
- Resume = `videoDownloadStart {videoId}`; it re-fetches the descriptor and takes the `paused` branch of §1.

### 3.6 Regular program while downloading (**open**)

Either keep downloading in the background or auto-suspend on program start and auto-resume on program end. Both are acceptable. Either way the entry stays `downloading` on the wire and progress simply stalls; do **not** report `paused` — that status is reserved for the physio's explicit Pause.

## 4. Library State: building and reporting

The headset owns one function, `BuildLibraryState()`, and sends its output over two channels. Both channels carry the same object; only the trigger and the transport differ.

### 4.1 Building the payload from the manifest

Map every manifest entry to a `VideoLibraryEntry`:

| Manifest `status` | Entry fields                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `downloading`     | `status`, `version`, `sizeBytes`, `bytesDownloaded` (current `.part` size; `0` if queued)    |
| `paused`          | `status`, `version`, `sizeBytes`, `bytesDownloaded`                                          |
| `ready`           | `status`, `version`, `sizeBytes`                                                             |
| `failed`          | `status`, `reason`; `version`/`bytesDownloaded` only when a `.part` was kept (`url_expired`) |

Videos that are not in the manifest are simply not listed — the console treats absence as `absent`. Never invent `absent` entries.

Then add `freeBytes` (free space on the volume holding `videos/`, measured at call time, not cached).

```json
{
  "videos": [
    {
      "videoId": "cyc_01",
      "status": "ready",
      "version": 3,
      "sizeBytes": 4831838208
    },
    {
      "videoId": "wlk_02",
      "status": "downloading",
      "version": 1,
      "sizeBytes": 2147483648,
      "bytesDownloaded": 913571840
    },
    {
      "videoId": "wlk_03",
      "status": "paused",
      "version": 1,
      "sizeBytes": 3221225472,
      "bytesDownloaded": 1384120320
    },
    { "videoId": "cyc_04", "status": "failed", "reason": "checksum_mismatch" }
  ],
  "freeBytes": 12884901888
}
```

Read the manifest and `.part` sizes under the same lock the download worker uses to write them, so a report never shows a `ready` entry whose final-file rename has not finished.

### 4.2 Channel 1 — socket `videoLibraryState` (live)

Emit the payload above, unchanged, on:

- every `videoLibraryStateRequest` (within 2 s);
- every `roomComplete` where a console is present — this is the unsolicited send after reconnect, wake, or relaunch;
- after `videoDelete` has finished removing files.

Do **not** emit it on download start/pause/complete/fail — those have their own events, and the console updates its row from them. Emitting the full state there is harmless but redundant.

### 4.3 Channel 2 — `PUT /api/v1/device-videos` (durable)

The same payload plus the **Headset Identity** as `deviceId`:

```http
PUT /api/v1/device-videos HTTP/1.1
Host: <same base URL as /api/v1/device-pairing/claim>
Content-Type: application/json

{ "deviceId": "<Headset Identity>", "videos": [ ... ], "freeBytes": 12884901888 }
```

The server **replaces** every `DeviceVideo` row for that Headset Identity with `videos`, upserts the `DeviceVideoReport` header (`freeBytes`) and stamps `reportedAt`. It is a full snapshot, not a delta — always send the whole library.

| Response          | Meaning                                   | Headset does                                     |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| `204`             | Stored.                                   | Clear `dirty`.                                   |
| `400`             | Body failed validation.                   | Log; do not retry the same body. Treat as a bug. |
| `404`             | `deviceId` is not paired to any `Device`. | Log; stop reporting until the next pairing.      |
| `5xx` / no answer | Server or network.                        | One immediate retry, then keep `dirty`.          |

Send it on these triggers, and only these:

| Trigger                                                  | Why the Library Mirror needs it                                 |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| App launch and wake, after reconcile and resume          | The Library Mirror learns about silent resumes with no console. |
| Download **started** (dequeued and first byte requested) | Offline consoles show "Downloading — as of …".                  |
| Download **paused**                                      | Offline consoles show "Paused 43 %".                            |
| Download **completed**                                   | The main case: finishes after the physio left.                  |
| Download **failed** (any reason, including `cancelled`)  | Row returns to failed/absent.                                   |
| Video **deleted**                                        | Row removed.                                                    |
| Connectivity returns while `dirty` is set                | Catch-up.                                                       |

Never on progress ticks and never on `stalled` transitions — progress is socket-only.

Coalesce: if several triggers fire within a short window (e.g. delete three videos), one `PUT` with the final state is enough; only the latest snapshot matters. A `PUT` must never block the download worker or the render loop — queue it on a background task.

`dirty` and the last snapshot survive a relaunch only implicitly: launch always sends a fresh report anyway, so no persistence is needed for the flag.

### 4.4 Auth

None in v1. Both `PUT /api/v1/device-videos` and `GET /api/v1/device-videos/:videoId` validate that `deviceId` is on a non-deleted `Device`. No rate limit in v1. A pairing-issued device token will be added later as a header; the payloads do not change.

## 5. Playback

- Player for 180° stereoscopic video: hemisphere mesh (or SDK sky renderer), inside-out UVs, per-eye layout. **(open, with content team):** SBS vs. top-bottom, resolution, codec and bitrate. Prefer H.265 hardware decode; keep the bitrate within what the device decoder sustains at the target resolution. The platform applies **no encoding constraint in v1** — the catalog accepts any `mp4, m4v, mov, webm, mkv` file and nothing server-side inspects the stream — so playback compatibility is agreed between the VR and content teams, not enforced by upload.
- Head tracking is rotation only. No translation, no locomotion, no controller requirement.
- `videoRecenter`: rotate the hemisphere so the video's forward aligns with the current head yaw. Stateless; safe to send repeatedly.
- `videoPlaybackProgress {positionSec, durationSec, paused}` ≤ 1/s while playing **and while paused** (`paused: true`); `videoEnded` on natural end and after `videoStop`. A console joining mid-playback relies on this tick to re-attach its controls within 2 s.
- A console disconnect must not stop playback. A `videoStop` from any console that later joins the room must still be honoured.
- `Idle` / `Starting` show a neutral environment (dark or the existing lobby). No menus.
- Audio (**open**): play the track if present; headset volume is the only control.
- A `videoDownloadStart` arriving during playback is queued normally; a download in flight does not affect playback beyond bandwidth.

## 6. Headset-side UI

- One passive, non-interactive element (small bar or ring in the lobby) while a download runs; hidden otherwise. It may show a percentage. It shows nothing for `paused`, `stalled`, or `failed` — those are console concerns.
- No dialogs, confirmations, lists, or error text for this feature anywhere on the headset.

## 7. Failure reason mapping

| Situation on the headset                                                 | Reason                            | `.part` |
| ------------------------------------------------------------------------ | --------------------------------- | ------- |
| Precheck fails, or disk fills while streaming                            | `insufficient_storage`            | deleted |
| Hash mismatch at EOF, or length mismatch                                 | `checksum_mismatch`               | deleted |
| HTTP 403 / 410 after one descriptor refresh                              | `url_expired`                     | kept    |
| Descriptor endpoint 404 (video unpublished/deleted, or headset unpaired) | `unavailable`                     | deleted |
| Other 4xx, disk I/O, permission, anything unexpected                     | `network`                         | deleted |
| `videoDownloadCancel`                                                    | `cancelled`                       | deleted |
| Transport loss, timeout, reset, wifi off, sleep                          | _not a failure_ — `stalled` retry | kept    |

Log the underlying exception for every `network` so it can be triaged from headset logs.

## 8. Test matrix

1. Fresh download → hash matches, final file present, `videoDownloadComplete`, API row `ready`.
2. Wifi off mid-download → `stalled: true` ticks; wifi on → resumes from offset without any console action; final hash matches.
3. Headset sleeps mid-download → on wake resumes silently; console sees offline then `downloading` at the resumed byte count.
4. Kill the app mid-download → relaunch resumes silently, API report shows `downloading` before any console connects.
5. Pause → `.part` kept, `paused` on socket and API; relaunch does **not** resume; `videoDownloadStart` resumes from offset.
6. Pause while queued; Cancel while queued, running, and paused.
7. Storage full → `insufficient_storage` before the first byte; no `.part` left.
8. Corrupt the `.part` before resume → `checksum_mismatch`, file removed.
9. Re-request an already-`ready` video → ack + immediate complete, no I/O.
10. Version bump: `.part` for v1, request v2 → restarts from 0.
11. Edge returns `200` to a ranged request (defensive; not expected from CloudFront) → restart from 0, hash still matches.
12. Console disconnects mid-download and mid-playback → both unaffected; a new console gets `videoLibraryState` on join.
13. Regular program started with a download running → program unaffected; entry remains `downloading`.
14. API unreachable → report retried on the next transition; socket state still correct throughout.
15. `PUT` body matches the socket `videoLibraryState` byte-for-byte apart from `deviceId`; a `ready` video never appears in a report before its final-file rename has completed.
16. Delete three videos in a row → a single (or coalesced) `PUT` with the final state; server rows match the manifest.
17. `videoDelete` while that video plays.
18. Descriptor 404 → `videoDownloadFailed {unavailable}`, no `.part` left.
19. CDN 403 → descriptor re-fetched, resumes with the new URL at the same offset; hash matches.
20. CDN 403 and descriptor now a newer version → `.part` discarded, new version downloaded from 0.
21. API unreachable on `videoDownloadStart` → ack still sent within 5 s; `stalled` ticks; resumes when the API returns.
22. `videoPause` → `videoPlaybackProgress` keeps ticking with `paused: true`; a console joining the room re-attaches as Paused.
