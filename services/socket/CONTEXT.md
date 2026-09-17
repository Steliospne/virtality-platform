# Socket

Real-time bridge between the console frontend and VR headsets during treatment workflows.

## Language

**Room Peer Role**:
The side of a treatment room connection occupied by a real-time peer. The canonical roles are `console` and `vr`.
_Avoid_: Agent, client, generic room member

**Role Slot**:
The single room position reserved for one **Room Peer Role**. A room has one `console` slot and one `vr` slot.
_Avoid_: First member, second member, room capacity count

**Active Role Peer**:
The current peer occupying a **Role Slot**. When a new peer connects for the same **Room Peer Role**, it becomes the **Active Role Peer** for that slot.
_Avoid_: Duplicate peer, stale member, old instance

**Role Peer Replacement**:
A new peer taking over an occupied **Role Slot** for the same **Room Peer Role**. It applies to both `console` and `vr`, and is not treated as the previous peer leaving the room.
_Avoid_: Member left, extra member, room full retry

**Replacement Notice**:
A message sent to the previous **Active Role Peer** when a **Role Peer Replacement** occurs.
_Avoid_: Generic disconnect, silent replacement

**Server Device Controller**:
The socket-side module that admits a connecting peer and either seats it in its **Role Slot** and relays its events to the other **Room Peer Role**, or answers it as a **Presence Check**. One instance serves every room on its namespace; it holds a **Role Slot Room Registry**.
_Avoid_: Device event controller (the console has a module of that name), connection handler, socket handler

**Role Slot Room Registry**:
The in-memory record of every open room and which peer currently occupies each **Role Slot**. It decides outcomes (joined, replaced, cleared, evicted); it does not talk to sockets.
_Avoid_: Room store, active rooms, room map

**Relay**:
The socket-side module that decides what happens to one inbound event from a seated peer: forwarded to the other **Room Peer Role**, blocked (stale peer, missing room or role), or not relayed (not in the relay table). It returns the outcome as data, including the payload framing and log level; the **Server Device Controller** performs the single emit and log line. One `onAny` listener per peer feeds it.
_Avoid_: Relay handler, per-event listener, forwarder closure

**Relay Family**:
One of the per-domain `RelayEventMap`s in shared (`PROGRAM_RELAY`, `CASTING_RELAY`, `DEVICE_RELAY`, `VIDEO_RELAY`) that the **Relay** table is built from. `GAME_RELAY` is a family that exists in shared but is deliberately not registered.
_Avoid_: Event group, relay category, event map (when the merged table is meant)

**Presence Check**:
A console-side socket connection that only asks which rooms currently have an **Active Role Peer** in the `vr` slot. It occupies no **Role Slot** and joins no room.
_Avoid_: Presence-only socket, presence mode, polling client

**Simulated Headset**:
A standalone client process that connects to the socket server as the `vr` **Active Role Peer** of one room and behaves like the headset build for program and video events. The server carries no simulation code; the seam is the socket, the same one a real headset uses. Its core is pure (`handle`/`tick` return emits as data) and a thin socket.io-client adapter pipes them to the wire.
_Avoid_: Sim mode, `SIM=true`, test client, vrCommsTesting
