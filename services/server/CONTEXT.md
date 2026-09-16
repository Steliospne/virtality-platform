# Server

Platform API context for authenticated account, user, device, and clinical workflow requests shared by the Virtality apps.

## Language

**Pending Password Change**:
A short-lived request by an authenticated user to set or change their password that takes effect only after email approval.
_Avoid_: Password reset, immediate password change, password update

**Library Mirror**:
The Postgres cache of one headset's **Library State** (`DeviceVideoReport` + `DeviceVideo` rows), keyed by **Headset Identity**, written by the console from the headset's socket events and read by the console when that headset is offline. It also holds the physio's pending **Download Request** rows (`requested`), which the headset never reports. The headset never writes it.
_Avoid_: Mirror (as the term), device library table, server-owned library

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
- A **Library Mirror** full report replaces the snapshot for that **Headset Identity** except `requested` rows the report does not name; download events patch one row each.
- A **Library Mirror** write is a console (oRPC) call scoped to a headset bound to a Device the caller owns. The headset never calls the platform API for **Immersive Video**; it downloads through its Addressables catalog on the CDN.

## Example Dialogue

> **Dev:** "Can we use the normal password reset copy for this profile action?"
> **Domain expert:** "No — call it a **Pending Password Change** because the user started it while signed in, then approves it from email."
