# Pending Password Change Security Design

Profile password setup and change must not take effect immediately after the user submits a new password. A signed-in user starts the flow from profile, receives an approval email at their verified primary address, and only completes the credential change after deliberate confirmation. This ADR records why **Pending Password Change** is modeled as its own security lifecycle rather than reusing account-recovery password reset or generic auth verification records.

## Distinction from password reset and account recovery

**Password reset** is account recovery: the user is typically unauthenticated, may have lost access, and proves mailbox control to replace a forgotten password. **Pending Password Change** is credential management for an already authenticated account. It starts from an active profile session, targets the user's current verified primary email, and (for existing-password changes) requires current-password proof before a pending request is even created.

The flows must stay separate in naming, persistence, email templates, and confirmation routes so recovery links cannot be confused with profile approval links and so security reviewers can reason about each lifecycle independently.

## Why email links open a confirmation page instead of mutating state

Email clients, security scanners, and link prefetchers may request URLs embedded in messages without user intent. If opening the approval link applied the password, an automated fetch could complete a credential change the user never confirmed.

The approval email therefore links to a dedicated confirmation page (`/password-setup/confirm` for setup; a parallel change route when implemented). Visiting the page only **inspects** the token and shows context. The password is applied only when the user presses an explicit **Approve** action that calls a separate approve procedure. Inspect and approve are distinct server operations.

## Why pending material is stored only as server-side hashed data

The pending record stores:

- **`pendingPasswordHash`** — a Better Auth-compatible hash of the requested password, produced at submit time and held only until approval or invalidation.
- **`approvalTokenHash`** — a SHA-256 digest (base64url) of the raw approval token. The raw token appears only in the email link and request handling path; it is never persisted.

Plaintext passwords are not written to the database, client state, local storage, or logs. Tests assert the persistence payload contains only hashed fields. Hashing routes through `@virtality/auth` so approved passwords match existing credential storage.

## Why explicit persistence instead of generic auth verification records

Better Auth's `Verification` model is a generic identifier/value store for short-lived proofs across multiple flows. Pending password change needs a richer lifecycle: user association, setup vs change kind, status (`PENDING`, `APPROVED`, `CANCELLED`, `SUPERSEDED`), initiating session id, destination email, expiry, and consumed/cancelled/superseded timestamps.

A first-class `PendingPasswordChange` model makes the security state machine explicit, queryable, and unit-testable without overloading verification rows whose semantics differ per flow. The lifecycle module exposes a small interface (create, read, inspect, approve, resend, cancel) so behavior can be tested independently of UI and transport.

## Lifecycle semantics

| Property                                | Behavior                                                                                                                                                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One active pending request per user** | Creating, resending, or replacing a request invalidates older approval tokens.                                                                                                                             |
| **Latest-request-wins**                 | Approval validates that the token's row is still the newest `PENDING` record for that user. Older tokens fail even if not yet expired. Superseded rows move to `SUPERSEDED`.                               |
| **30-minute expiry**                    | `expiresAt` is set to 30 minutes from creation or resend. Expired tokens are treated as invalid.                                                                                                           |
| **Token-only approval**                 | Inspect and approve procedures are public and accept only the approval token. An active browser session is not required, so users can finish from a mail client on another device.                         |
| **Resend**                              | Authenticated. Rotates the approval token and refreshes expiry while **preserving** the already-submitted `pendingPasswordHash` so the user does not re-enter the password. Invalidates prior email links. |
| **Cancel**                              | Authenticated. Does not require current-password proof. Marks the pending row `CANCELLED` so the email link cannot approve later.                                                                          |
| **Invalid links**                       | Expired, consumed, cancelled, superseded, or unknown tokens return a **generic** failure message so attackers cannot distinguish account state.                                                            |

Session handling after approval differs by kind: first-time **setup** preserves existing sessions and linked social providers; **change** (when implemented) revokes other sessions while keeping the initiating session.

## Rejected alternatives

| Alternative                                       | Why rejected                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Reuse the reset-password / forgot-password flow   | Conflates account recovery with authenticated profile credential management; wrong trust assumptions and UX.    |
| Single GET link that applies the password on open | Vulnerable to email prefetch and accidental activation; no deliberate confirmation step.                        |
| Persist plaintext pending passwords               | Increases credential exposure if the database or backups leak during the approval window.                       |
| Overload `Verification` rows                      | Cannot express supersede/cancel/resend, setup vs change, or session-revocation policy without opaque encodings. |
| Multiple simultaneous pending changes per user    | Complicates latest-wins semantics and increases risk of approving an outdated password choice.                  |
| Require an active session on the approval page    | Blocks completing approval from the device where the email was opened.                                          |
| Send a second completion email after approval     | Adds noise; the approval email is the only message in this flow.                                                |

## Consequences

- ORPC exposes authenticated start/read/resend/cancel procedures plus public inspect/approve procedures bound to the lifecycle module.
- Console profile UI shows pending destination email, expiry, resend, and cancel while a request is active.
- Approval email uses a dedicated template with setup/change copy variants, including button and fallback link.
- Invalid-token UX offers profile return for a signed-in matching user and sign-in otherwise, without leaking why the token failed.
- Future maintainers should extend **CHANGE** behavior on this model rather than introducing parallel persistence.
