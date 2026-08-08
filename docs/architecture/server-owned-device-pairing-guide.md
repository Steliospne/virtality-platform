# Server-Owned Device Pairing Implementation Guide

**Status:** Implemented; pending deployment and device smoke test  
**Applies to:** Console, platform API, PostgreSQL, VR client, and socket service  
**Decision:** PostgreSQL and the platform API are authoritative for pairing. Redis and temporary socket rooms are not required for pairing correctness.

## Final flow

```mermaid
sequenceDiagram
    participant Console
    participant API
    participant DB as PostgreSQL
    participant VR
    participant Socket

    Console->>API: Start(accountDeviceId)
    API->>DB: Supersede old attempt; create pending attempt
    API-->>Console: attemptId, raw six-digit code, expiresAt
    loop Every 2 seconds while pending
        Console->>API: Status(attemptId)
        API-->>Console: pending or terminal state
    end
    VR->>API: POST code + headsetDeviceId
    API->>DB: Atomically bind Device.deviceId and consume attempt
    API-->>VR: paired
    VR->>Socket: Join permanent headsetDeviceId room
    API-->>Console: completed on next poll
```

The Console may cancel an active attempt. The VR has no pairing-cancel operation; closing or destroying its pairing UI only cancels the local HTTP request. Pending attempts expire after five minutes.

## Database

`DevicePairingAttempt` stores:

- the raw six-digit `code`;
- nullable unique `activeCode`, which prevents two active attempts from sharing a code;
- nullable unique `activeDeviceKey`, which permits one active attempt per account-device record;
- owner and account-device foreign keys;
- status, expiry, completion, cancellation, supersession, and headset fields.

Terminal transitions clear both active uniqueness guards. `Device.deviceId` is unique, so two account-device records cannot claim the same headset.

The migration deliberately creates the unique device-ID index without silently repairing existing data. Before applying it outside development, run:

```sql
SELECT "deviceId", COUNT(*)
FROM "Device"
WHERE "deviceId" IS NOT NULL
GROUP BY "deviceId"
HAVING COUNT(*) > 1;
```

Resolve any returned duplicates before deploying the migration.

## API contracts

Authenticated Console procedures:

| Procedure              | Input                | Result                                        |
| ---------------------- | -------------------- | --------------------------------------------- |
| `devicePairing.start`  | `{ deviceRecordId }` | `{ attemptId, code, expiresAt, serverTime }`  |
| `devicePairing.status` | `{ attemptId }`      | `{ attemptId, state, expiresAt, serverTime }` |
| `devicePairing.cancel` | `{ attemptId }`      | terminal state                                |

Public VR routes:

| Route                                                | Input/result                                         |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `POST /api/v1/device-pairing/claim`                  | `{ pairingCode, deviceId }` → `{ status: "paired" }` |
| `GET /api/v1/device-pairing/registrations/:deviceId` | `{ paired: boolean }`                                |

The claim route returns `400` for malformed input, `404` for an unknown/expired/consumed code, and `409` when the headset is already bound elsewhere. A successful repeated claim by the same headset is accepted for ten minutes so a lost response does not strand the VR.

## Correctness rules

- All ownership checks are server-side; a user cannot start, read, or cancel another user's attempt.
- Starting again supersedes the prior pending attempt for that account device.
- Claim and device assignment occur in a serializable PostgreSQL transaction.
- Database unique constraints are the final authority during concurrent starts and claims.
- Expiry is enforced when status or claim is read; no worker is required.
- Pairing remains complete if the subsequent permanent-room socket connection temporarily fails.
- A claim timeout is followed by a registration check to recover from an ambiguous HTTP response.

## Console behavior

The device card asks the API for the code, stores the active attempt in `sessionStorage`, and polls status every two seconds only while pending. Polling survives a page refresh, stops for every terminal state, and refreshes the device list on completion. Console cancel remains available and calls the authenticated cancel procedure.

The Console no longer generates pairing codes locally, writes them to Redis, joins pairing-code rooms, or performs the device-ID database update received through Socket.IO.

## VR behavior

The pairing UI accepts exactly six numeric characters and calls `PairDeviceAsync`. The API client posts the raw code and stable headset device ID, maps stable HTTP outcomes, and never requires Redis connectivity.

After success, the VR marks itself paired, persists its stable ID, closes the pairing UI, and joins the existing permanent socket room named by device ID.

An unsuccessful API claim remains an unsuccessful pairing attempt. The VR does not join a temporary pairing-code socket room or fall back to the legacy socket handshake.

## Socket service

No socket-server change is required for the new authoritative transaction. Permanent device-ID rooms remain unchanged. Pairing-only socket events may remain temporarily for old deployed clients, but neither the new Console nor the new VR uses them.

## Explicit v1 decisions

- Store the raw pairing code; do not add HMAC/pepper infrastructure yet.
- Use no Redis in pairing clients or server correctness logic.
- Add no custom rate limiter in v1.
- Keep Console cancellation; expose no VR cancellation command.

These choices keep v1 small. Before exposing pairing to a materially more hostile network or much larger traffic volume, revisit code-at-rest protection and abuse controls as a separate security change.

## Deployment order

1. Audit duplicate non-null `Device.deviceId` values.
2. Apply the PostgreSQL migration.
3. Deploy the API and Console.
4. Verify start/status/cancel and claim against the deployed API.
5. Release the VR build.
6. Monitor pairing completion, expiry, conflict, and API error rates.
7. After old deployed clients are gone, remove the unused pairing-only socket events.

Do not release the new Console or VR before the migration and API are live. Freshly paired headsets must run the new VR version.

## Verification checklist

- Happy path completes within the next two-second Console poll.
- Wrong and expired codes leave the account-device record unchanged.
- Repeated claim after a lost response returns success for the same headset.
- Two headsets racing for one code produce one success.
- One headset cannot be bound to two active account-device records.
- Starting again invalidates the earlier code.
- Refreshing Console during pairing resumes status polling.
- Console cancellation invalidates the code.
- VR startup recognizes an already paired device.
- After pairing, Console and VR meet in the permanent device-ID room.
