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
A bucket object whose CDN URL or object key is used by another platform resource.
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
_Avoid_: Template draft

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

### Access and billing

**Tester Code**:
A one-time bearer staff-issued code, formatted `TE-` plus ten alphanumeric characters, that grants tester access when consumed at sign-up. It is a separate system from a **Trial Redeem Code**; both use the same sign-up code field and the server routes by prefix. Adminboard issues and manages Tester Codes under Admin (not Billing).
_Avoid_: Referral Code, QA code, Testing Code, promo

**Trial Redeem Code**:
A one-time bearer code, formatted `PAY-` plus ten alphanumeric characters, that starts a no-card **Trial Subscription** when redeemed at sign-up. Unused codes expire one week after creation. Staff may copy the code or send it with a **System Email**; the send recipient is delivery-only, not a bind. Default trial length is fourteen days with an optional per-code day override. Empty codes and well-formatted codes that are not in the store do not create an account and send the clinician to the website waitlist; Expired and Already used block with error copy. It is a separate system from a **Tester Code**; both use the same sign-up code field and the server routes by prefix. Distinct from **Coupon**, **Promotion Code**, and **Discount**. Adminboard issues and manages Trial Redeem Codes under Billing.
_Avoid_: Billing Code, Access Code, Customer Redeem Code

**Trial Subscription**:
A Subscription currently in its trial phase, started without requiring a card when configured that way.
_Avoid_: free sub, trialing subscription (as the term), trial offer

**Entitlement Clock**:
The single clock that determines whether the clinician may launch VR programs. When it is expired, VR program launch is blocked and the app stays usable. Stripe remains the source of truth for the underlying end time.
_Avoid_: trial_end (as product speak), access window, license timer, Seat, org seat, multi-seat

**Billing Path Established**:
At least one synced local Subscription row for the clinician's Stripe Customer, in any status. A Stripe Customer id alone does not establish the path. Console waitlist applies only when the user is not admin/tester and this path is not established; clock expiry never signs the user out to waitlist when the path is established.
_Avoid_: has Stripe customer, ever paid, currently entitled

**Extension**:
A staff-applied lengthening of the **Entitlement Clock** by days, weeks, or months. For a live seat, the chosen duration is added onto the current clock end (not measured from "now", which would overwrite Remaining Time). Expired, canceled, or never-entitled seats get a new no-card **Trial Subscription** whose clock starts from now plus the chosen duration.
_Avoid_: renewal, top-up, trial extension (as a separate entity name), replace clock with now+N

**Renew Email Trigger**:
An Adminboard-configured row `{ daysBefore, active }` that schedules a renew **System Email** offset before **Entitlement Clock** end. Independent from the in-app list. Empty or all-inactive rows silence email (no separate master switch). Copy stays code-owned.
_Avoid_: Stripe Billing reminder, renew master switch

**Renew In-app Trigger**:
An Adminboard-configured row `{ daysBefore, active }` that schedules an in-app renew prompt offset before **Entitlement Clock** end. Independent from the email list. Empty or all-inactive rows silence in-app (no separate master switch). Chrome copy stays code-owned / `[COPY]`.
_Avoid_: toast blast, global notification toggle

**Renew Prompt Delivery**:
A once-per-channel-per-offset record for the current **Entitlement Clock** epoch (keyed by clock end). Powers System Email and in-app renew chrome; missed offsets catch up once on next evaluation; none after expiry. Extension or successful Subscribe/Renew Checkout that changes the clock end starts a new epoch and drops prior-epoch backlog.
_Avoid_: Stripe Billing reminder, renew master switch

**Coupon**:
Stripe discount definition (percent or amount off, duration set at creation). Staff and campaigns apply Coupons; clinicians do not type a Coupon id. Distinct from **Trial Redeem Code** and **Tester Code**.
_Avoid_: Trial Redeem Code, Tester Code, deal, offer code

**Promotion Code**:
Customer-facing redeem string that wraps a **Coupon**, created in Adminboard and entered by the clinician (including mid-cycle on Profile → Billing). Distinct from **Trial Redeem Code** and **Tester Code**.
_Avoid_: Trial Redeem Code, Tester Code, Coupon (as the typed string), promo code, voucher

**Discount**:
The live redemption of a **Coupon** (optionally via a **Promotion Code**) on a Subscription (or Checkout-created Subscription). Product rule: one Discount at a time.
_Avoid_: applied coupon (as the term), deal, stacked offers

**Campaign Window**:
An Adminboard-owned start/end interval during which Subscribe Checkout may auto-attach a chosen **Coupon** for eligible new subscribers. Ending the window stops new attaches; it does not remove **Discounts** already on Subscriptions.
_Avoid_: promo period, sale event, Campaign Coupon (as a separate object type)
