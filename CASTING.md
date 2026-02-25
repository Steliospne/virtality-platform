# VR Casting (WebRTC prototype)

Prototype route that receives a video stream from a VR headset in the browser via WebRTC, with signaling over the existing Socket.IO server.

## Quick start

1. **Start the socket server** (from repo root or `services/socket`):
   ```bash
   cd services/socket && npm run dev
   ```
   Server runs on port **8081** by default.

2. **Start the console app**:
   ```bash
   cd apps/console && npm run dev
   ```

3. **Open the casting page**:  
   Go to **http://localhost:3000/casting** (route is unlisted in the sidebar).

4. **On the casting page**:
   - Select a **paired device** (device must have a `deviceId` from the Devices page).
   - Click **Connect to room** so the console joins the same room as the VR client (room code = device ID).
   - When the status shows **In room**, click **Start casting**.
   - The console emits `webrtc:requestOffer`; the VR app should create an SDP offer and emit `webrtc:offer`. The console then creates an answer and emits `webrtc:answer`. The remote video stream appears in the `<video>` element.

## Socket events (handshake)

| Event                  | Direction   | Payload | Description |
|------------------------|------------|---------|-------------|
| `webrtc:requestOffer`  | Console → VR | none  | Console asks VR to create and send an offer. |
| `webrtc:offer`         | VR → Console | SDP   | VR sends its `RTCSessionDescription` (offer). |
| `webrtc:answer`       | Console → VR | SDP   | Console sends its `RTCSessionDescription` (answer). |

All events are forwarded by the socket server within the **same room** (same `roomCode` = device ID). ICE candidate exchange is **omitted** in this prototype.

## VR / Unity side

1. Connect to the socket server with the same **roomCode** (device ID) and join the room (e.g. `agent: 'vr'` or similar).
2. Listen for **`webrtc:requestOffer`**. When received, create an `RTCPeerConnection`, create an offer with `createOffer()`, set it as local description, then emit **`webrtc:offer`** with the offer object (e.g. `JSON.stringify(offer)` or the object itself).
3. Listen for **`webrtc:answer`**. When received, call `setRemoteDescription(answer)` on your peer connection. The WebRTC connection should then establish and the console will show the video track you send.

## Files touched

- **services/socket**: `src/types/models.ts` (WEBRTC_EVENT), `src/sockets/prod-server.ts` (register WebRTC events).
- **apps/console**: `types/models.ts` (CASTING_EVENT), `hooks/use-casting-handshake.ts`, `app/casting/page.tsx`.

## Notes

- Uses the **same device and room** as the patient dashboard; the console must be in a room with the VR client (same `roomCode`) before starting casting.
- Errors are logged to the browser console only (no toasts in this prototype).
- ICE is not exchanged; for production or difficult networks, add ICE candidate relay over the socket.
