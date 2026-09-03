# Pending Account Deletion Security Design

Deleting a profile account must not take effect immediately after the user presses "Delete account". A signed-in user starts the flow from profile, receives an approval email at their verified primary address, and only completes the deletion after deliberate confirmation. This ADR records why **Pending Account Deletion** is modeled as its own security lifecycle, mirroring `PendingPasswordChange` (see ADR 0002), rather than reusing Better Auth's built-in `deleteUser` verification flow.

## Why Better Auth's built-in delete-user flow was retired

Better Auth's `user.deleteUser` option previously sent a verification email whose link (`GET /delete-user/callback`) deleted the account as soon as it was opened by a session matching the requester. This is the "single GET link that applies on open" pattern already rejected for password change in ADR 0002: email clients, security scanners, and link prefetchers may request URLs embedded in messages without user intent, and a destructive, irreversible action must never be one accidental fetch away from completion.

`deleteUser` is now disabled in `auth-instance.ts`. Account deletion is handled entirely by the `PendingAccountDeletion` lifecycle described below.

## Why email links open a confirmation page instead of mutating state

The approval email links to a dedicated confirmation page (`/delete-account/confirm`). Visiting the page only **inspects** the token. The account is deleted only when the user presses an explicit **Delete account** action that calls a separate approve procedure. Inspect and approve are distinct server operations, identical in shape to the password-change confirmation flow.

## Why deletion is soft, not a hard row delete

Approval marks the `User` row deleted (`deletedAt`, matching the convention already used repo-wide on `User`, `Device`, and other user-owned models) rather than removing it with `prisma.user.delete()`. A hard delete would cascade-drop billing history, program data, and audit trails that the business still needs after a user leaves, and it forecloses any future "restore my account" support flow. `banned: true` reuses Better Auth's admin-plugin ban gate to reject new sessions for the account outright, and every existing `Session` row is deleted at approval so already-issued cookies stop working immediately. Because `email` and `image` are unique columns, they are rewritten to a `deleted+<userId>@deleted.virtality.invalid` placeholder (mirroring the `Device` soft-delete convention of nulling its unique `deviceId`) so the original email address is freed for a new sign-up. Callers that must exclude deleted accounts already filter with `deletedAt: null`, the same pattern used everywhere else in the codebase — no new query convention was introduced.

## Why pending material is stored only as hashed data

The pending record stores only:

- **`approvalTokenHash`** — a SHA-256 digest (base64url) of the raw approval token. The raw token appears only in the email link; it is never persisted.

There is no equivalent of `pendingPasswordHash` here — deletion has no payload beyond "delete this user".

## Why explicit persistence instead of generic auth verification records

A first-class `PendingAccountDeletion` model makes the security state machine explicit, queryable, and unit-testable, consistent with the reasoning in ADR 0002 for `PendingPasswordChange`. It tracks user association, status (`PENDING`, `APPROVED`, `CANCELLED`, `SUPERSEDED`), initiating session id, destination email, expiry, and consumed/cancelled/superseded timestamps.

## Lifecycle semantics

| Property                                | Behavior                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One active pending request per user** | Creating or resending a request supersedes older approval tokens.                                                                                                                                                                                                                                                            |
| **Latest-request-wins**                 | Approval validates that the token's row is still the newest `PENDING` record for that user. Older tokens fail even if not yet expired.                                                                                                                                                                                       |
| **30-minute expiry**                    | `expiresAt` is set to 30 minutes from creation or resend, matching pending password change.                                                                                                                                                                                                                                  |
| **Token-only approval**                 | Inspect and approve procedures are public and accept only the approval token, so users can finish from a mail client on another device.                                                                                                                                                                                      |
| **Resend**                              | Authenticated. Rotates the approval token and refreshes expiry. Invalidates prior email links.                                                                                                                                                                                                                               |
| **Cancel**                              | Authenticated. Marks the pending row `CANCELLED` so the email link cannot approve later.                                                                                                                                                                                                                                     |
| **Invalid links**                       | Expired, cancelled, superseded, or unknown tokens all return the same generic failure message as pending password change so attackers cannot infer account state.                                                                                                                                                            |
| **Approval**                            | Soft-deletes the `User` row: sets `deletedAt`, `banned: true`, frees the unique `email`/`image` columns (renamed to a `deleted+<userId>@…` placeholder so the address can be reused by a new sign-up), and revokes every `Session` row for the user. The row itself, and its history (billing, programs, etc.), is retained. |

## Rejected alternatives

| Alternative                                         | Why rejected                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep Better Auth's built-in `deleteUser` email flow | A single GET link applies the deletion on open; no deliberate confirmation step for an irreversible action.                                                          |
| Require current password to start the request       | The existing "Delete account" button already required no extra proof beyond an authenticated session; adding one is a separate UX decision outside this ADR's scope. |
| Overload `Verification` rows                        | Cannot express supersede/cancel/resend without opaque encodings, same reasoning as ADR 0002.                                                                         |

## Consequences

- ORPC exposes authenticated start/read/resend/cancel procedures plus public inspect/approve procedures bound to the lifecycle module, under `pendingAccountDeletion`.
- Console profile UI shows pending destination email, expiry, resend, and cancel while a deletion request is active, replacing the immediate "Delete account" action.
- Approval email uses a dedicated template with a button and fallback link, matching the visual language of the pending password change email.
- Invalid-token UX offers profile return for a signed-in matching user and sign-in otherwise, without leaking why the token failed.
- On approval, the browser is signed out and redirected to `/goodbye`, matching the previous post-deletion destination.
