# Server-Owned Device Pairing

Device pairing is an API-owned, short-lived transaction. Console asks the platform API to create a single-use Pairing Code for an authenticated Account Device; VR submits that code and its Headset Device ID directly to the API; and the API atomically consumes the code and binds the device. Console observes completion through an authenticated status read. Socket.IO is not authoritative for pairing and is used only after pairing for the Permanent Device Room and real-time treatment communication.

This replaces the temporary pairing-code socket room, browser-handled `sendDeviceId` database mutation, acknowledgement relay, and direct VR-to-Redis code validation. The change makes pairing durable across browser lifecycle changes, gives VR a definitive response, centralizes ownership and uniqueness checks, and removes backend Redis credentials from client code.

For v1, the database stores the raw six-digit code and the public claim route has no custom rate limiter. Pairing correctness depends only on the API and PostgreSQL. Console can cancel an attempt; VR exposes no cancel command.

Implementation and rollout requirements are defined in [`docs/architecture/server-owned-device-pairing-guide.md`](../architecture/server-owned-device-pairing-guide.md).
