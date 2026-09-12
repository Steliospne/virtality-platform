# Headset-owned video library with a headset-written Library Mirror

**Status:** accepted

The 180° FPV **Immersive Video** mode (map: issue #283) puts multi-GB files on a headset's disk and lets a physio manage them from the console. Something has to tell the console what is on a headset that is currently off. The two live candidates were a platform-owned record the console writes as it issues commands, or a headset-owned record the headset reports. We chose the headset: its disk is the only thing that knows whether a file is really there, and every command can fail after the console has moved on.

## Decision

1. **The headset's disk is the source of truth** for the **Headset Library**. The headset reports its **Library State** live over the socket relay and durably to the platform API; it never reads the catalog.
2. **The headset writes the Library Mirror.** `PUT /api/v1/device-videos` replaces every `DeviceVideo` row for one **Headset Identity** with the full snapshot and stamps `reportedAt`. It is sent once on app launch and at every transition (download started, paused, completed, failed, video deleted), never on progress ticks.
3. **The console never writes the Library Mirror**, and never reads it while the headset is in the room. While the room is complete the console renders live **Library State** only; when the headset is offline it renders the Library Mirror read-only, labelled "as of `reportedAt`".
4. **Keyed by Headset Identity** (`Device.deviceId`, the hardware identifier), not `Device.id`. The rows belong to the hardware: re-pairing a headset to another account does not touch them, because the files really are on the headset.
5. **Unauthenticated in v1, no rate limit in v1**, like `POST /api/v1/device-pairing/claim`: the route trusts the Headset Identity and requires it to be bound to a non-deleted `Device`. A pairing-issued device token (and rate limiting with it) is a later effort that must not change the body.

## Rejected alternatives

| Alternative                                  | Why rejected                                                                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Console-written mirror (write on command)    | The console only knows what it asked for, not what happened. Downloads finish after the tab closes, fail on the headset, and resume silently after a reboot; a console-written record drifts immediately.  |
| Server-pulled manifests (API polls headsets) | Headsets are behind NAT and asleep most of the time; the platform has no channel to them outside the socket room. Pull inverts the only reliable direction of knowledge.                                   |
| Authenticated route in v1                    | There is no device credential yet; inventing one blocks the feature on pairing changes. The pairing claim already trusts the Headset Identity on the same terms, and the token slots in later as a header. |

## Consequences

- Two channels carry the same object: the socket for everything live, the HTTP report for durable snapshots. Neither replaces the other.
- A missed report is only ever visible in the offline view; the console re-asks the headset whenever it is online.
- The console's "Not in catalog" and "Update available" states are derived by diffing Library State against the catalog; the headset never sees the catalog and never derives them.

## References

- Map: [Immersive Video (180° FPV)](https://github.com/Virtality-app/virtality-platform/issues/283)
- Contract and lifecycles: `docs/architecture/immersive-video-shared-contract.md`, `docs/architecture/immersive-video-lifecycle.md` §6
- Domain language: `apps/console/CONTEXT.md` (**Headset Library**, **Library State**), `services/server/CONTEXT.md` (**Library Mirror**), `apps/console/CONTEXT.md` (**Headset Identity**)
