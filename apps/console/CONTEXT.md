# Console

Clinician-facing web app for managing patients, building therapy plans, and running rehabilitation workflows.

## Language

**Reusable Program**:
A clinician-owned therapy program template that can be used with any of that clinician's patients. It belongs to the clinician's library, not to a patient.
_Avoid_: Global program, preset, patient program, assigned program, generic program

**Session Exercise Snapshot**:
The exercise list and settings of a patient session once the session is completed, including any live clinician changes made during the session.
_Avoid_: Starting program copy, active program, program exercise history

**Session Working Copy**:
The persisted, mutable exercise list and settings used during an active patient session. Changes to it do not change the **Reusable Program** unless the clinician explicitly saves them back or saves them as a new **Reusable Program**.
_Avoid_: Editing the program live, implicit program update

**Session Completion Save Choice**:
The end-of-session decision to either finish without changing the **Program Library**, update the source **Reusable Program**, or save the final **Session Working Copy** as a new **Reusable Program**.
_Avoid_: Autosave to program, live save prompt

**Quick Start**:
An ad hoc treatment path that starts a patient session without choosing a **Reusable Program** first.
_Avoid_: Blank program, temporary program

**Settings-First Authoring**:
Program authoring and editing flows that open on the selected **Program Exercise** list/settings step, then optionally proceed to the exercise catalog to add or remove variants. **Quick Start**, scratch **Reusable Program** creation, **Starter Template** creation, and **Reusable Program** editing all follow this two-step model. The selected-list step is for naming, tuning, and final actions; the catalog step is for discovery and selection. Selection and settings persist when navigating between steps.
_Avoid_: Catalog-first authoring, nested Exercise Library dialog, parallel exercise-picker paths

**Session Launch Attempt**:
The period after a clinician asks the VR to start treatment but before the VR confirms that treatment has started.
_Avoid_: Patient session, started session

**Started Session**:
A patient session that begins only after the VR confirms the treatment start.
_Avoid_: Button press, launch attempt

**Interrupted Session**:
A **Started Session** that ended unexpectedly before normal completion. It is not treated as completed clinical history.
_Avoid_: Completed session, failed launch

**Session Progress Record**:
Exercise performance data captured during a **Started Session** and persisted incrementally as treatment progresses.
_Avoid_: End-only session data, temporary progress

**Completed Rep Measurement**:
Performance data for a repetition that has actually finished during a **Started Session**. Completed repetition numbers are one-based ordinals in console domain language.
_Avoid_: In-progress rep, expected rep, skipped rep placeholder

**Completed Set**:
A set whose prescribed repetitions have finished during a **Started Session**. Completed set numbers are one-based ordinals in console domain language.
_Avoid_: Current set index, previous set index, zero-based set number

**Progress Save Checkpoint**:
A treatment transition where the current **Session Progress Record** should be preserved: set completion, **Session Exercise Skip**, normal session end, or **Interrupted Session** handling. A **Completed Rep Measurement** creates progress data; a checkpoint preserves it. A failed immediate remote save should not block treatment when the progress remains recoverable for a later checkpoint or session end.
_Avoid_: Save every frame, end-only save, rep-as-transaction

**Pending Exercise Change**:
A clinician-requested exercise change during a **Started Session** that has created a progress-preservation boundary but has not yet been acknowledged by the headset. Only one **Pending Exercise Change** can be in flight; additional exercise changes wait until it resolves. If the headset does not acknowledge the change, the request fails and the previous exercise remains the **Headset-Confirmed Current Exercise**.
_Avoid_: Current exercise, completed skip

**Headset-Confirmed Current Exercise**:
The exercise the headset has acknowledged as active during a **Started Session**.
_Avoid_: Requested exercise, selected list row, optimistic current exercise

**Session Exercise Completion**:
The normal closure of an exercise attempt after the prescribed repetitions and sets have been completed during a **Started Session**. It is a **Progress Save Checkpoint** but not a **Session Exercise Skip**.
_Avoid_: Automatic skip, clinician skip, exercise navigation

**Session Exercise Skip**:
A clinician action during a **Started Session** that closes the current exercise attempt before normal completion, preserves any partial **Session Progress Record** made from **Completed Rep Measurements**, and makes another exercise current after headset acknowledgement. This includes bounded forward/back controls and direct exercise selection; forward/back controls do not wrap around the exercise list. Selecting the already-current exercise is a no-op, not a skip. The skip's progress-preservation boundary is the clinician action, so later headset messages from the previous exercise do not extend the skipped attempt. It does not invent progress for unattempted or in-flight repetitions. It is not simple navigation and it is not an **Interrupted Session**.
_Avoid_: Exercise navigation, failed exercise, session interruption

**Program Exercise**:
An exercise and settings entry that belongs to a **Reusable Program**. It represents reusable treatment intent, not patient history.
_Avoid_: Preset exercise, session exercise, exercise settings row

**Last Used Program**:
The most recently selected **Reusable Program** for a patient, used only as a convenience default when returning to that patient's dashboard.
_Avoid_: Current program, assigned program, patient program

**Program Library**:
The clinician's collection of **Reusable Programs** available for treatment workflows.
_Avoid_: Presets page, template manager

**Retired Program**:
A **Reusable Program** that no longer appears for future treatment selection but remains available for historical session context.
_Avoid_: Deleted program, removed program

**Starter Template**:
A system-provided starting point for creating a clinician-owned **Reusable Program**. It is not selected directly during treatment, and clinicians preview its included exercises before using it.
_Avoid_: Preset, system program, Virtality program

**Exercise Family**:
The canonical movement concept independent of side-specific direction (for example, "Active Wrist Extension").
_Avoid_: Base exercise, parent exercise, generic exercise

**Exercise Variant**:
A concrete selectable exercise defined by an **Exercise Family** plus one direction value (for example, Left or Right).
_Avoid_: Child exercise, side item, duplicate exercise

**Direction**:
A laterality or orientation qualifier that differentiates one **Exercise Variant** from another within the same **Exercise Family**.
_Avoid_: Side label, handedness flag

**Direction Set (Near-Term)**:
The allowed direction vocabulary for exercise-program authoring in the near term is Left and Right only.
_Avoid_: Open direction labels, arbitrary direction text

**Family Key**:
The attribute used to identify an **Exercise Family** in the current system. In the console context, this is `displayName`.
_Avoid_: Name key, title key

**Dual-Side Auto-Add**:
Selection behavior where choosing an **Exercise Family** automatically adds both Left and Right **Exercise Variants** when both exist; otherwise, the single available variant is added.
_Avoid_: Implicit pairing, bulk side add

**Grouped Family Entry**:
A selected-program row that represents both side variants of the same **Exercise Family** as one compact entry until side-specific edits require a split.
_Avoid_: Merged duplicate, combined row

**Edit Sides Separately**:
An explicit, always-visible toggle on a **Grouped Family Entry** that lets clinicians switch from unified family settings to side-specific settings for each **Exercise Variant**.
_Avoid_: Auto split, implicit divergence

**Stage-Aware Removal**:
Removal behavior that differs by workflow stage: in library selection, deselect immediately; in the selected-program list, require confirmation only when side-specific settings would be lost. Direction toggles can mark an **Exercise Variant** as disabled and defer actual removal until submit.
_Avoid_: Global confirmation, one-rule removal

**Deferred Direction Removal**:
When a direction is toggled off in the selected-program list, the **Exercise Variant** remains visible with its settings preserved but read-only until re-enabled; persisted removal happens only on submit in both program creation and program editing flows.
_Avoid_: Immediate direction delete, hidden pending removal

**Deferred Removal Marker**:
Client-side pending-removal state for an **Exercise Variant** is keyed by selected-row identity (`CompleteExercise.id`), not catalog identity (`exerciseId`).
_Avoid_: exerciseId-based pending removal keys

**Bulk Selection Scope**:
**Exercise Variants** marked for deferred removal are excluded from bulk selection controls (`Select all`, segment checkbox aggregation, and `Remove Selected`).
_Avoid_: Bulk actions that include pending-removal variants

**Disabled Family Visibility**:
When both Left and Right **Exercise Variants** of a family are marked for deferred removal, the family row remains visible in a disabled state until submit.
_Avoid_: Immediate row collapse for fully disabled families

**Deferred Removal Retry Semantics**:
If submit fails, deferred-removal markers remain unchanged in the UI so clinicians can retry without rebuilding selection intent.
_Avoid_: Clearing pending-removal state on failed submit

**Deferred Removal Styling**:
Deferred-removal **Exercise Variants** are communicated with muted styling only (no explicit status badge text).
_Avoid_: Extra textual pending-removal labels

**Deferred Toggle Reversibility**:
Re-enabling a deferred-removal **Exercise Variant** restores it exactly as-is, preserving both its prior settings and its position in the selected-program list.
_Avoid_: Re-enable reset, reinsert-at-end behavior

**Enabled-Only Submit Guard**:
Submit is blocked when no enabled **Exercise Variants** remain, and validation feedback is shown as a toast.
_Avoid_: Allowing zero-enabled submit

**Disabled Row Reorder Guard**:
When a grouped family row is fully in deferred-removal state, its reorder controls are disabled.
_Avoid_: Reordering fully deferred-removal rows

**Deferred-Removal Scope (Current)**:
Deferred removal applies to direction-toggle interactions in the selected-program list; `Remove Selected` remains immediate-delete behavior.
_Avoid_: Broad removal-semantics changes in the same iteration

**Pending Password Change**:
An email-approved profile flow where a signed-in user submits a new password, receives an approval email at their verified primary address, and explicitly confirms before the credential is set or changed. Distinct from **password reset**, which is unauthenticated account recovery.
_Avoid_: Password reset, email verification, pending password setup as a separate concept

**Device Pairing**:
The exclusive bind of a durable **Headset Identity** onto one live console Device. Ownership of that identity belongs to the User who owns that Device. Success means the identity is persisted on that Device, not that a live Socket.IO peer is present. A Headset Identity has at most one live Device bind at a time; soft-deleted Devices do not count as live. The bind is completed out-of-band via a **Pairing Claim** and **Pairing Code**, not via a Socket.IO pair room.
_Avoid_: Pair room, in-room pair, socket pairing, connected-as-paired, shared headset identity across Devices

**Headset Identity**:
The durable identifier of a physical headset (`deviceId`) that **Device Pairing** binds to a Device. Live treatment communication uses this identity after the bind; it is not itself a pair-room code or **Pairing Code**.
_Avoid_: Pair code, room code, temporary pairing token, Pairing Code

**Pairing Code**:
The short-lived 6-digit secret shown by the console during **Device Pairing**. The VR presents it (with its **Headset Identity**) to complete the claim. Possession of a valid, unexpired, unconsumed code is the capability to claim; clinician cancel or TTL expiry invalidates it. After a successful claim, the same **Headset Identity** may briefly replay that completed claim so a lost response does not strand the VR; that replay does not create a second bind.
_Avoid_: Room code, QR pairing secret, Headset Identity, reusable pair PIN

**Pairing Claim**:
The server-side outstanding claim for one Device during **Device Pairing**. The Device owner creates it; a successful VR claim consumes it and writes the **Headset Identity** onto that Device (subject to the one-owner rule). Cancel or expiry invalidates it without binding. A consumed claim cannot bind again; see **Pairing Code** for the short same-headset replay window.
_Avoid_: Pair room, socket session, durable Device row

**Unpair**:
The clinician action that clears the **Headset Identity** from a Device without deleting the Device. It is performed by the Device owner in the console and succeeds without the headset present or acknowledging. It releases that identity from the Device so a later **Device Pairing** (on this Device or another) may bind it, subject to the one-owner rule on claim. Changing which headset a Device owns requires **Unpair** first, then a new **Device Pairing**; the bind is not overwritten in place. Unpair is an ownership action, not a live-peer disconnect.
_Avoid_: Remove, disconnect, reset device, replace headset overwrite, treating Unpair as a Socket.IO leave

**Device Removal**:
Soft-deleting a Device from the owning clinician's list. It also releases any bound **Headset Identity**; a soft-deleted Device must not keep an active bind. Distinct from **Unpair**, which clears the bind and keeps the Device.
_Avoid_: Unpair, hard delete as the only remove path, soft-delete while keeping identity

### Access and billing

**Tester Code**:
A one-time bearer staff-issued code, formatted `TE-` plus ten alphanumeric characters, that grants tester access when consumed at sign-up. It is a separate system from a **Trial Redeem Code**; both use the same sign-up code field and the server routes by prefix.
_Avoid_: Referral Code, QA code, Testing Code, promo

**Trial Redeem Code**:
A one-time bearer code, formatted `PAY-` plus ten alphanumeric characters, that starts a no-card **Trial Subscription** when redeemed at sign-up. Unused codes expire one week after creation. Default trial length is fourteen days with an optional per-code day override. Empty codes and well-formatted codes that are not in the store do not create an account and send the clinician to the website waitlist; Expired and Already used block with error copy. It is a separate system from a **Tester Code**; both use the same sign-up code field and the server routes by prefix. Distinct from **Coupon**, **Promotion Code**, and **Discount**.
_Avoid_: Billing Code, Access Code, Customer Redeem Code

**Trial Subscription**:
A Subscription currently in its trial phase, started without requiring a card when configured that way.
_Avoid_: free sub, trialing subscription (as the term), trial offer

**Entitlement Clock**:
The single clock that determines whether the clinician may launch VR programs. When it is expired, VR program launch is blocked and the app stays usable.
_Avoid_: trial_end (as product speak), access window, license timer, Seat, org seat, multi-seat

**Billing Path Established**:
At least one synced local Subscription row for the clinician's Stripe Customer, in any status. A Stripe Customer id alone does not establish the path. Console waitlist applies only when the user is not admin/tester and this path is not established; clock expiry never signs the user out to waitlist when the path is established.
_Avoid_: has Stripe customer, ever paid, currently entitled

**Paid billing history**:
Synced Subscription history shows a completed paid Pro billing period (not only trial-style entitlement that never converted). Free rows never count. Canceled seats count only when the paid period continued past trial end (`periodEnd > trialEnd`). Drives Subscribe vs Renew, Campaign Window Subscribe attach eligibility, and Adminboard Assign Free after cancellation (with live paid Pro as an alternate gate).
_Avoid_: ever had a Subscription, Billing Path Established, any canceled Pro

**Cycle plan change**:
Queued paid Pro monthly ↔ yearly switch at the next billing cycle (`stripeScheduleId` / Better Auth `scheduleAtPeriodEnd`). Profile Billing schedules and releases through one shared module backed by Better Auth upgrade/restore. Distinct from cancel-at-period-end (same restore underneath, different clinician intent: Cancel vs Don't cancel).
_Avoid_: immediate price swap, proration upgrade, portal-only interval change

**Remaining Time**:
The clinician-visible duration left on the **Entitlement Clock**, always shown in the console sidebar.
_Avoid_: days remaining (as the term), time left, access remaining

**Renew Prompt**:
A seat-holder renew nudge delivered by Virtality System Email and/or in-app chrome at Adminboard-configured day offsets before **Entitlement Clock** end. Each channel×offset fires once per clock epoch (keyed by clock end); missed offsets catch up once on next evaluation; none after expiry. Extension or successful Subscribe/Renew Checkout that changes the clock end starts a new epoch and drops prior-epoch backlog.
_Avoid_: Stripe Billing reminder email, toast blast

**Profile Billing**:
The Profile → Billing tab (`?tab=billing`) where clinicians choose Monthly vs Yearly **Pro** and start Checkout, or open the Customer Portal when already entitled. Sidebar Subscribe/Renew and renew-banner CTAs deep-link here rather than opening Checkout directly. One Product (**Pro**); two Prices (`pro_monthly`, `pro_yearly`). Checkout uses `authClient.subscription.upgrade({ plan: 'pro', annual: true | false, … })`. Yearly display shows monthly equivalent primary with yearly total muted. Do not show role in Billing UI. Checkout is allowed when `stripeCustomerId` exists even without **Billing Path Established** (`resolveProfileBillingCheckoutCta`). Active seats use Manage in portal.
_Avoid_: Checkout-from-sidebar, role badge on Billing, multi-product plan picker

**Coupon**:
Stripe discount definition (percent or amount off, duration set at creation). Staff and campaigns apply Coupons; clinicians do not type a Coupon id. Distinct from **Trial Redeem Code** and **Tester Code**.
_Avoid_: Trial Redeem Code, Tester Code, deal, offer code

**Promotion Code**:
Customer-facing redeem string that wraps a **Coupon**, created in Adminboard and entered by the clinician (including mid-cycle on Profile → Billing). Distinct from **Trial Redeem Code** and **Tester Code**.
_Avoid_: Trial Redeem Code, Tester Code, Coupon (as the typed string), promo code, voucher

**Promotion Code Delivery**:
Staff-upserted open row that notifies this Console user about a **Promotion Code** (one open row per userId + promotionCodeId). Adminboard owns the write path; Console delivery chrome is out of this map.
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

## Example Dialogue

Dev: "Should we list every **Exercise Variant** directly in the picker?"  
Domain expert: "No, start from **Exercise Family** first so the list stays compact."

Dev: "How do we identify a family in the current data model?"  
Domain expert: "Use `displayName` as the **Family Key** for now."

Dev: "When a family has Left and Right, what gets added?"  
Domain expert: "Use **Dual-Side Auto-Add**, then show it as a **Grouped Family Entry** unless side settings diverge."

Dev: "How does a clinician apply different settings to Left and Right?"  
Domain expert: "They use **Edit Sides Separately** from the grouped row when they need side-specific control."

Dev: "When should removal ask for confirmation?"  
Domain expert: "Use **Stage-Aware Removal** so we stay fast in selection and safe in settings."

Dev: "Do we support more direction labels right now?"  
Domain expert: "No, use the **Direction Set (Near-Term)** of Left and Right."

Dev: "Should clinicians pick exercises before they see settings?"  
Domain expert: "No, use **Settings-First Authoring** so they land on settings first, then optionally add exercises from the catalog."

Dev: "Can they still open a separate Exercise Library dialog from the settings step?"  
Domain expert: "Not in **Settings-First Authoring** flows: use Add exercises to open the catalog step."
