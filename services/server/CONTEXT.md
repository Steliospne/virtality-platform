# Server

Platform API context for authenticated account, user, device, and clinical workflow requests shared by the Virtality apps.

## Language

**Pending Password Change**:
A short-lived request by an authenticated user to set or change their password that takes effect only after email approval.
_Avoid_: Password reset, immediate password change, password update

**Library Mirror**:
The headset-written Postgres cache of one headset's **Library State** (`DeviceVideoReport` + `DeviceVideo` rows), keyed by **Headset Identity**. The console reads it only when that headset is offline. The console never writes it.
_Avoid_: Mirror (as the term), device library table, server-owned library

**Download Descriptor**:
The server-issued description of one **Immersive Video** for a headset — the current verified version, its CDN URL, byte size and SHA-256 — fetched by the headset for each **Download Request** and refreshed by the headset when the URL is rejected. Issued only for a paired **Headset Identity** and only for a catalog entry that is currently published. The console never handles it.
_Avoid_: Manifest (the headset's on-disk file), download ticket, download link, presigned URL, `VideoDownloadStartPayload`

## Relationships

- A **Pending Password Change** belongs to exactly one authenticated user.
- A **Pending Password Change** for an existing password requires current-password proof before email approval.
- Only the latest **Pending Password Change** for a user can be approved, and it expires after 30 minutes.
- A **Pending Password Change** is approved through the user's current verified primary email address.
- A **Pending Password Change** can be approved without an active session when the approval token is valid.
- Email approval for a **Pending Password Change** requires an explicit confirmation action after opening the email link.
- A first-time **Pending Password Change** adds password sign-in without removing existing sign-in methods.
- A **Pending Password Change** remains visible to the user until it is approved, cancelled, replaced, or expired.
- Resending a **Pending Password Change** preserves the requested password value while replacing the approval token and expiry.
- Approval copy distinguishes first-time password setup from password change.
- A **Pending Password Change** sends an approval email only, not a separate completion email.
- Approving a password change preserves the initiating session and revokes other active sessions.
- Approving a first-time password setup preserves existing sessions.
- Invalid **Pending Password Change** approval links do not reveal whether the request expired, was used, cancelled, or replaced.
- Cancelling a **Pending Password Change** requires an authenticated session but not current-password proof.

- A **Library Mirror** belongs to exactly one **Headset Identity**, not to a Device row; re-pairing does not move or clear it.
- A **Library Mirror** write replaces the whole snapshot for that **Headset Identity**; there are no partial updates.
- A **Download Descriptor** is issued only for a **Headset Identity** currently bound to a non-deleted Device, and only for a `Published` or `Republishing` catalog entry (the last verified version).
- Neither the **Library Mirror** write nor the **Download Descriptor** read is authenticated or rate-limited in v1; both trust the **Headset Identity** the way the pairing claim does.

## Example Dialogue

> **Dev:** "Can we use the normal password reset copy for this profile action?"
> **Domain expert:** "No — call it a **Pending Password Change** because the user started it while signed in, then approves it from email."
