# Adminboard

Internal admin dashboard for managing platform resources and operational content.

## UI patterns

When a dropdown menu item opens a dialog, follow `docs/adr/0002-dropdown-dialog-pointer-events.md` (controlled menu, `modal={false}`, defer dialog open via `useDropdownMenu`).

## Language

**Highlight Card**:
A landing-page content unit with a title, body copy, and a Lucide icon name. Style is owned by the website; Adminboard manages copy and icon selection only.
_Avoid_: Feature card, benefit card, info card

**Highlight Card Collection**:
An ordered set of Highlight Cards for one landing placement, such as Benefits or Features. Adminboard Content sections share one managing tool and differ only by which collection they edit.
_Avoid_: Card list, feature set, benefit set

**Bucket Object**:
A file-like asset stored in the platform media bucket and served through the Virtality CDN.
_Avoid_: S3 resource, file resource

**Object Key**:
The slash-separated, URL-safe name of a bucket object. Admin-created object keys keep a readable filename stem and include a unique suffix.
_Avoid_: File path, S3 path

**CDN URL**:
The public Virtality CDN address for a bucket object.
_Avoid_: File path, S3 URL

**Object Replacement**:
A content update that creates a new bucket object instead of changing the contents at an existing CDN URL.
_Avoid_: Overwrite

**Referenced Bucket Object**:
A bucket object whose CDN URL or object key is used by another platform resource, including an Exercise or an Exercise Draft.
_Avoid_: Attached file

**Folder**:
A navigational grouping of bucket objects by shared path-like location. Empty folders are not independent admin-managed things.
_Avoid_: Directory

**Folder Operation**:
An admin action applied to every bucket object in a folder.
_Avoid_: Folder CRUD

**Admin-authored Email**:
A marketing, newsletter, or announcement email composed by an Adminboard admin using Email Body Blocks.
_Avoid_: Custom template, HTML email

**System Email**:
A code-owned account or product email that changes infrequently and is not edited through the no-code builder.
_Avoid_: Transactional template

**Email Draft**:
A saved, editable Admin-authored Email that has not been final-sent.
_Avoid_: Template draft, Exercise Draft

**Sent Email Record**:
An immutable record created by Final Send, including the rendered snapshot and per-recipient delivery results.
_Avoid_: Sent message

**Email Body Block**:
A structured content unit in the no-code builder, such as Heading, Paragraph, Image, Button, List, Card, or Divider.
_Avoid_: Component, widget

**Email Brand Shell**:
The locked Virtality header, footer, and sender identity wrapped around admin-authored body content.
_Avoid_: Email layout, wrapper template

**Email Recipient List**:
The explicit list of recipient email addresses entered for a draft send.
_Avoid_: Audience, mailing list

**Email Test Send**:
A required pre-send delivery to verify the rendered email in a real inbox.
_Avoid_: Preview send

**Final Send**:
The immediate, irreversible send that creates a Sent Email Record.
_Avoid_: Blast send, publish

### Exercises

**Exercise Draft**:
A saved, not-yet-promoted exercise family from the Adminboard creation wizard. One record is one sitting and becomes one or two Exercise rows on promotion; it is not an Exercise.
_Avoid_: Email Draft, Wizard Session, disabled Exercise (as in-progress work)

**Exercise family**:
The Exercise rows that share one `displayName`: either a Left and right pair or a Single entry. Console treats that exact `displayName` as the family key.
_Avoid_: Exercise group, bilateral set

**Left and right pair**:
An Exercise family stored as two rows that share `displayName` and media, with `direction` Left and Right and Unity `name`s suffixed `_L` and `_R`.
_Avoid_: Bilateral (as wizard copy; that word already appears in `displayName` for some Single entries)

**Single entry**:
An Exercise family stored as one row with `direction` Both and an unsuffixed Unity `name`.
_Avoid_: Unilateral (as wizard copy), Both (as the laterality label; Both is the stored `direction` value)

**Enabled Exercise**:
An Exercise row visible in the clinician catalog, stored as `enabled: true`.
_Avoid_: Production-ready, published, live Exercise

**Enable in Console**:
The Review action that promotes a complete Exercise Draft to Enabled Exercise row(s) for the family.
_Avoid_: Publish, go live

### Access and billing

**Tester Code**:
A one-time bearer staff-issued code, formatted `TE-` plus ten alphanumeric characters, that grants tester access when consumed at sign-up. It is a separate system from an **Access Code**; both use the same sign-up code field and the server routes by prefix. Adminboard issues and manages Tester Codes under Admin (not Billing).
_Avoid_: Referral Code, QA code, Testing Code, promo

**Access Code**:
A one-time bearer code, formatted `GO-` plus ten alphanumeric characters, with mode **Free** or **Trial**. At sign-up, Free mode issues a Permanent **Access Gate**; Trial mode issues a Timed Access Gate (default fourteen days with an optional per-code day override). Unused codes expire one week after creation. Staff may copy the code or send it with a **System Email**; the send recipient is delivery-only, not a bind. Empty codes and well-formatted codes that are not in the store do not create an account and send the clinician to the website waitlist; Expired and Already used block with error copy. It is a separate system from a **Tester Code**; both use the same sign-up code field and the server routes by prefix. Distinct from **Coupon**, **Promotion Code**, and **Discount**. Adminboard issues and manages Access Codes under Billing.
_Avoid_: Trial Redeem Code, Billing Code, Customer Redeem Code, `PAY-` prefix, free_grant/trial_grant (internal mode keys, not product speak)

**Access Gate**:
The app-owned record of Free or Trial access, independent of Stripe — no Stripe Subscription is created for it. Two modes, read off whether an end date is set rather than a stored field: Permanent (no end date, replaces the old "Assign permanent Free") and Timed (has an end date). Statuses: granted (Permanent — an administrative record only; staff's non-Stripe lever for standing access bookkeeping, does **not** by itself allow VR launch), trialing (Timed — the only status that ever allows VR launch, and only while its clock has not lapsed; a lapsed Timed gate keeps status trialing, it is the **Entitlement Standing**'s `entitled` flag that goes false, not this status), converted (superseded once the clinician's paid Stripe Subscription reaches Active — Stripe governs from there; terminal, does not revive as a fallback if that Subscription later stops being live; also the one standing status that permanently blocks staff from issuing this clinician a fresh gate, even after that Subscription later cancels — this is what "Paid billing history gates re-issuance" resolves to), revoked (staff pulls it; terminal, no ban — a fresh gate is unaffected since revoked is not open). "Open" (granted or trialing, as opposed to the terminal converted/revoked) is what a gate stays until its natural lifecycle moves it on — a gate's own status can advance this way without becoming a new row. A granted, converted, or revoked gate blocks VR launch exactly like a lapsed Timed gate; there is no fallback free tier. Renamed and consolidated from `TrialGrant` plan Free access.
A gate's mode is fixed for its lifetime **for self-serve Access Code redemption**: redeeming a new code always issues a brand-new gate rather than converting an existing one from Permanent to Timed or back, so a clinician can hold a Permanent gate and a Timed gate at once (e.g. after redeeming a Trial code on top of a standing Free grant). **Staff actions in Adminboard are the one exception** (ADR 0008): a customer has at most one open gate under staff management, and staff freely flip that same row between Permanent and Timed (Assign Access / Issue-or-Extend Trial Access) until it is revoked or converted — those two are the only terminal states. This can still leave a customer with two open rows if a staff-issued gate and a self-serve-redeemed gate coexist; that combination is accepted as a rare edge case, not designed around.
_Avoid_: TrialGrant (old name), Trial Subscription, Free Subscription, Free plan, trialing subscription (as a synonym for the Timed mode itself, rather than the status), AccessPortal, OnboardingGate, Assign permanent Free (retired staff action name), mode field (mode is derived from the end date, never stored separately), "mode fixed for lifetime" as a blanket rule (only true for self-serve redemption, not staff actions)

**Entitlement Clock**:
The single clock that determines whether the clinician may launch VR programs. When it is expired, VR program launch is blocked and the app stays usable. Source of truth is a trialing **Access Gate** before conversion (a granted Permanent Access Gate never carries a live clock — same always-expired display as the old Free plan), and Stripe once converted to a paid Subscription.
_Avoid_: trial_end (as product speak), access window, license timer, Seat, org seat, multi-seat

**Entitlement Standing**:
Server read model of the clinician's Entitlement Clock and related billing flags from synced Subscriptions (`buildEntitlementStanding`). Includes entitled, status, clockEnd, Billing Path Established, Paid billing history, Checkout CTA, pending Cycle plan change, and cancel-at-period-end.
_Avoid_: session entitlement blob, live countdown (that is Live Entitlement Standing)

**Live Entitlement Standing**:
Entitlement Standing re-evaluated at a client `now` for Remaining Time, VR soft gate, sidebar Checkout CTA, and related labels (`projectLiveEntitlementStanding`). Synced flags pass through; time-sensitive fields overwrite the standing values that went stale after the server `now`. Console owns the ticking hook and Checkout restore poll; this projection stays pure.
_Avoid_: client-side entitlement invent, dual-write clock, refetch-only countdown

**Billing Path Established**:
Either an **Access Gate** has ever been issued to the clinician, or at least one synced local Subscription row exists for their Stripe Customer, in any status. A Stripe Customer id alone does not establish the path. Console waitlist applies only when the user is not admin/tester and neither is true; clock expiry never signs the user out to waitlist when the path is established.
_Avoid_: has Stripe customer, ever paid, currently entitled, Subscription row alone (an Access Gate establishes the path too)

**Paid billing history**:
Synced Subscription history shows a completed paid Pro billing period (not only trial-style entitlement that never converted): any row in a live paid status, or any non-live row that reached a period end at all. Shared rule for Console Subscribe/Renew and Campaign Window. Adminboard's old Assign-Free-after-cancellation rule is now expressed directly on the **Access Gate**: a `converted` gate permanently blocks staff from issuing that clinician a fresh one, regardless of whether the paid Subscription that converted it is still live — see Access Gate.
_Avoid_: ever had a Subscription, Billing Path Established, any canceled Pro, periodEnd > trialEnd (dropped now that paid Default checkout never carries a Stripe trial period)

**Cycle plan change**:
Queued paid Pro monthly ↔ yearly switch at the next billing cycle (`stripeScheduleId` / Better Auth `scheduleAtPeriodEnd`). Adminboard Change paid plan schedules through the same Better Auth path as Console (not raw Stripe subscription schedules). Staff release with Cancel Cycle plan change (audit `cancel_cycle_plan_change`); Reactivate keeps its own audit label for cancel-at-period-end undo. Both release/reactivate call Better Auth restore.
_Avoid_: immediate admin price swap, Stripe schedule writer, conflating with Reactivate

**Assigned Variant**:
The clinician's app-owned Pro pricing option (for example `basic` or `early-bird`). Each option is a monthly plus yearly Stripe Price pair on the Pro Product, discovered from Stripe via Price `lookup_key` `{kebab-name}_{interval}` (for example `basic_monthly`, `early-bird_yearly`); the catalog always includes at least `basic`. Stored sparsely when staff assign from Adminboard; missing assignment reads as `basic`. Staff must not change Assigned Variant while the seat is live paid Pro. Catalog Prices are authored in Stripe Dashboard for now; Adminboard assigns only. Distinct from **Coupon**, **Promotion Code**, and **Discount**.
_Avoid_: price tier, custom price, Assigned Price, list-price override (as the term)

**Admin customer paid billing runtime**:
Paid customer mutations (preview/change plan, cancel, reactivate, cancel Cycle plan change, send Checkout link) enter via `createAdminCustomerBillingRuntime` in `@virtality/auth` (Prisma / Stripe / Cycle plan ports), not a pass-through Action per verb. Promo, catalog, campaign, and **Assigned Variant** keep their Action façades until deepened separately. Access Gate actions (including Extension) enter via **Admin Entitlement Clock runtime**, not this runtime — there is no Stripe-backed "assign Free after cancellation" any more.
_Avoid_: per-verb paid-billing Action, `@virtality/billing` package (deferred), assign Free after cancellation (retired; see Access Gate's `converted` status)

**Admin Entitlement Clock runtime**:
Staff mutations on a customer's **Access Gate** — Assign Access, Issue-or-Extend Trial Access, and Revoke — enter via `createAdminEntitlementClockRuntime` in `@virtality/auth` (an Access Gate Prisma port, plus Renew Prompt rearm). Orpc calls the runtime; do not keep per-verb Action façades. Assign Access does not rearm Renew Prompt; issuing a fresh Trial Access uses `rearmForNewClock`; extending existing Trial Access uses `rearmAfterExtension` when the clock end changes. Once the customer's Access Gate is `converted`, none of these apply — Stripe governs from there via the **Admin customer paid billing runtime**.
_Avoid_: per-verb Access/Extension Action, separate Access and Extension Prisma/Stripe ports (both retired — Extension no longer talks to Stripe), folding Renew Prompt evaluate into this runtime

**Extension**:
The staff action that lengthens or shortens a customer's open, pre-conversion **Access Gate** clock (`trialEnd`) by days, weeks, or months, via a staff-picked direction (Extend/Reduce; Extend is the default). Reads and writes the Access Gate row directly — no Stripe call, and no separate Stripe "Trial Subscription" is created. For an open Timed gate, the chosen duration is added onto (Extend) or subtracted from (Reduce) the current `trialEnd` (not measured from "now", which would overwrite Remaining Time); a Reduce that would put it at or before now is rejected — reduce by less, or Revoke instead. When the customer has no open Timed gate (never granted one, only holds a Permanent gate, or was previously revoked), the same staff control instead issues a new one (Extend only; Reduce has nothing to shorten) — Adminboard labels this case "Issue Trial Access" versus "Extend Trial Access" for an existing one, though both call the same runtime action. Extension does not apply once the Access Gate is `converted`; staff use the paid-plan controls instead.
_Avoid_: renewal, top-up, trial extension (as a separate entity name), replace clock with now+N, reduce on a non-live seat, Trial Subscription / no-card Trial Subscription (retired Stripe mechanism), PATCHing Stripe trial_end (retired)

**Renew Email Trigger**:
An Adminboard-configured row `{ daysBefore, active }` that schedules a renew **System Email** offset before **Entitlement Clock** end. Independent from the in-app list. Empty or all-inactive rows silence email (no separate master switch). Copy stays code-owned.
_Avoid_: Stripe Billing reminder, renew master switch

**Renew In-app Trigger**:
An Adminboard-configured row `{ daysBefore, active }` that schedules an in-app renew prompt offset before **Entitlement Clock** end. Independent from the email list. Empty or all-inactive rows silence in-app (no separate master switch). Chrome copy stays code-owned / `[COPY]`.
_Avoid_: toast blast, global notification toggle

**Renew Prompt Delivery**:
A once-per-channel-per-offset record for the current **Entitlement Clock** epoch (keyed by clock end). Powers System Email and in-app renew chrome; missed offsets catch up once on next evaluation; none after expiry. Extension or successful Subscribe/Renew Checkout that changes the clock end starts a new epoch and drops prior-epoch backlog. Clock-changing paths rearm via `createRenewPromptLifecycle`; evaluate and list-in-app use the same auth runtime.
_Avoid_: Stripe Billing reminder, renew master switch

**Coupon**:
Stripe discount definition (percent or amount off, duration set at creation). Staff and campaigns apply Coupons; clinicians do not type a Coupon id. Distinct from **Access Code**, **Tester Code**, and **Assigned Variant**.
_Avoid_: Trial Redeem Code, Tester Code, deal, offer code

**Coupon library**:
Adminboard-managed set of reusable **Coupons** that staff create and select when applying a **Discount** to a clinician Subscription.
_Avoid_: coupon catalog, discount list

**Promotion Code**:
Customer-facing redeem string that wraps a **Coupon**, created in Adminboard and entered by the clinician (including mid-cycle on Profile → Billing). Distinct from **Access Code** and **Tester Code**.
_Avoid_: Trial Redeem Code, Tester Code, Coupon (as the typed string), promo code, voucher

**Promotion Code Delivery**:
Adminboard write-path row that notifies a Console user about a **Promotion Code** (one open row per userId + promotionCodeId). Upserted from Coupon-nested in-app notify; Console chrome for that delivery is out of this map.
_Avoid_: promo inbox, discount notification, code bind

**Discount**:
The live redemption of a **Coupon** (optionally via a **Promotion Code**) on a Subscription (or Checkout-created Subscription). Product rule: one Discount at a time.
_Avoid_: applied coupon (as the term), deal, stacked offers

**Campaign Window**:
An Adminboard-owned start/end interval (at most one scheduled or live) during which Subscribe Checkout auto-attaches a chosen library **Coupon** for clinicians with no prior paid billing. Renew Checkout is excluded. Ending the window stops new attaches; it does not remove **Discounts** already on Subscriptions.
_Avoid_: promo period, sale event, Campaign Coupon (as a separate object type)

**Campaign registry**:
App-owned set of **Coupon** ids ever used as a campaign Coupon. Classifies a live **Discount** as campaign (vs staff). Ids remain after the window ends or the Coupon is swapped mid-window.
_Avoid_: campaign coupon list, active campaign only
