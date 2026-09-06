# A granted Permanent Access Gate does not entitle VR launch

Replacing Stripe's Free plan with the app-owned **Access Gate** (map: issue #250) required deciding what a Permanent Access Gate — the direct replacement for the old Adminboard "Assign permanent Free" action — actually grants. The two candidates were genuinely live options: a Permanent Access Gate could either (a) grant standing VR-launch entitlement with no end date, since "permanent access" reads naturally as "permanent VR access," or (b) carry no entitlement at all and exist purely as an app-owned administrative record, mirroring how a synced Stripe Free-plan `active` row was already treated by `resolveEntitlementClock` before this change (`status === 'active' && isFreeSubscriptionPlan` → not entitled).

Option (b) was chosen: a `granted`-status (Permanent) Access Gate never sets `entitled: true`. Only a `trialing`-status (Timed) Access Gate entitles VR launch, and only while its clock has not lapsed. This preserves the pre-existing behavior of Free-plan assignment exactly — Permanent Access Gate is a rename/relocation of that bookkeeping lever off Stripe, not a new capability — while the actual "let this clinician into VR without paying" lever remains the Timed Access Gate (via Access Code Trial mode or a staff-issued timed trial), unchanged from today's `TrialGrant`.

## Decision

- `status: 'granted'` (Permanent Access Gate, `trialEnd: null`): administrative record only. `entitled` stays `false`; Remaining Time displays as always-expired, same as the old Free-plan display. VR launch is blocked exactly as it is today for a Free-plan clinician.
- `status: 'trialing'` (Timed Access Gate, `trialEnd` set): the only Access Gate status that ever entitles VR launch, gated on `now < trialEnd`. This is the sole behavior carried over unchanged from `TrialGrant`.
- `converted` and `revoked` are both terminal and not entitled via the Access Gate; a paid Stripe subscription reaching `active` is what entitles from that point on (via the existing "paid Stripe active wins outright" precedence), independent of the Access Gate's own status.

## Rejected alternative

Making `granted` entitle VR launch indefinitely. Rejected because nothing in the current product actually requires the old Free-plan tier to unlock VR — it never did — and quietly changing that as a side effect of a rename would hand every Access-Code-Free or staff-Permanent-Access-Gate recipient VR access no reviewer asked for. If standing free VR access is ever wanted, it should be a deliberate new decision (and a new ADR), not an incidental consequence of moving Free off Stripe.

## Consequences

- "Assign a Permanent Access Gate" from Adminboard is bookkeeping, not a VR-access grant — this must be reflected in the Adminboard admin-action copy and confirmation flow (ticket #253), so staff don't believe they've unlocked VR for the clinician.
- Any future request for a genuinely free, standing VR tier needs new product sign-off; it does not fall out of the Access Gate model as designed here.
- `resolveEntitlementFromSources`'s dead "any other Stripe subscription row" fallback branch (which existed only to surface an inert Free-plan row's already-not-entitled standing) is deleted outright rather than adapted, since no Access-Gate-equivalent case needs it: `granted`/`converted`/`revoked` are already not-entitled by construction.
