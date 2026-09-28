# Testing headset features without a VR headset

The **Simulated Headset** (`services/socket/src/sim/`) joins a device's room as the `vr` peer and answers program and video events the way the headset build does. It connects through the same socket a real headset uses, so any console feature that waits on a headset can be run from start to finish locally. This includes program mode, the immersive video card, downloads, and the session time limit. Run it before you call a headset feature untested or say it needs a real headset.

## Run it

1. Start the socket server with `pnpm dev:apps`. `pnpm dev:console` does not start the socket server, so if you use it, also run `pnpm --filter @virtality/socket dev`.
2. In the console, open a patient dashboard and pick a device in the device dropdown. Its device id is the room code.
3. Run `ROOM_CODE=<deviceId> pnpm --filter @virtality/socket dev_sim`. `services/socket/README.md` has the options, such as `SOCKET_URL`.

The simulator is running when it logs `[sim] connected … room <deviceId>` and the console shows the headset in the room. The simulator logs every event it receives (`←`) and sends (`→`). Read those lines to confirm what the console sent.

## What it answers

- **Program:** acknowledges every command, counts reps and sets, and ends the program.
- **Video library:** starts empty every time the simulator starts. A download takes about 10 s. A `videoId` that starts with `fail-` fails its download. Download a video before you play it.
- **Playback:** acknowledges play and stop, so the console moves to Playing and back to Idle. It sends no playback progress, so the video's position stays at 0. It does not implement pause, and neither does the headset build (`HEADSET_VIDEO_SUPPORT.playbackPause`).

Timings and behaviour are in `services/socket/src/sim/simulated-headset.ts`, with tests in `simulated-headset.test.ts`. If a feature needs an event the simulator doesn't answer, extend the simulator and its tests so you can still check the feature.
