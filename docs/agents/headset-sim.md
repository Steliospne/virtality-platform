# Testing headset features without a VR headset

The **Simulated Headset** (`services/socket/src/sim/`) joins a device's room as the `vr` peer and answers program and video events the way the headset build does. It connects through the same socket a real headset uses, so any console feature that waits on a headset can be run from start to finish locally. This includes program mode, the immersive video card, downloads, and the session time limit. Run it before you call a headset feature untested or say it needs a real headset.

## Run it

1. Start the socket server, the API server and the console as three background processes: `pnpm --filter @virtality/socket dev`, `pnpm --filter @virtality/server dev` and `pnpm --filter @virtality/console dev`. Send each one's output to a log file. Use these instead of `pnpm dev:apps` or `pnpm dev:console`: turbo refuses to run long-running tasks without its terminal UI, so those commands exit at once when an agent runs them. The console is ready when `localhost:3001` and the socket server's port `8081` are both listening.
2. Open `localhost:3001`. The console needs a signed-in user, so ask the user to sign in in that tab.
3. On a patient dashboard, open **Device**, pick a device (the dev database has one named `sim`) and click **Connect**. The room code is in the socket server's log as `"roomCode"` in the `socket.room.role_slot_joined` entry.
4. Run `ROOM_CODE=<roomCode> pnpm --filter @virtality/socket dev_sim` in the background. `services/socket/README.md` has the options, such as `SOCKET_URL`.

The simulator is running when it logs `[sim] connected … room <roomCode>` and the device shows Online in the console. The simulator logs every event it receives (`←`) and sends (`→`). Read those lines to confirm what the console sent.

Leaving the patient dashboard disconnects the console from the device, and the console asks you to confirm first. When you come back, open **Device** and click **Connect** again. The simulator keeps its library while it runs.

To play an immersive video, first download it: open **VR Experiences**, pick the simulator's headset and click **Download** on a video. When you're done, stop the four processes you started.

## What it answers

- **Program:** acknowledges every command, counts reps and sets, and ends the program.
- **Video library:** starts empty every time the simulator starts. A download takes about 10 s. A `videoId` that starts with `fail-` fails its download.
- **Playback:** acknowledges play and stop, so the console moves to Playing and back to Idle. With `SIM_IGNORE_VIDEO_STOP=1` it never answers `videoStop`, so the console's stop times out after 5 s. It sends no playback progress, so the video's position stays at 0. It does not implement pause, and neither does the headset build (`HEADSET_VIDEO_SUPPORT.playbackPause`).

Timings and behaviour are in `services/socket/src/sim/simulated-headset.ts`, with tests in `simulated-headset.test.ts`. If a feature needs an event the simulator doesn't answer, extend the simulator and its tests so you can still check the feature.
