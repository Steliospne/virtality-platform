# PRD: Access Codes carry a Plan Variant

**Status:** Ready for implementation

**Domains:** `packages/db`, `packages/shared`, `packages/auth`, `packages/orpc`, `apps/adminboard`

**Origin:** `/grill-me` session, 2026-09-03. No linked GitHub issue.

---

## Problem

Today, granting a user the correct Plan Variant (`User.assignedDefaultVariant`) is a two-step, staff-mediated process: the user must already have an account before an admin can manually assign a variant via the "Assign Plan variant" dialog. Access Codes (`GO-` bearer codes, `TrialRedeemCode`) already automate trial/free-subscription grants at redemption time, but carry no notion of which Plan Variant the redeemer should land on.

## Goal

Let an admin pick a Plan Variant when generating an Access Code. Redeeming that code — at sign-up or later from Profile Billing — auto-applies the variant to the user's account, with no staff step required. Manual assignment stays available as the fallback path for accounts not covered by a variant-carrying code.

## Locked decisions (from grilling)

| #   | Decision                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Manual assignment (`assignPlanVariantForCustomer`) is **not replaced** — it remains the fallback/override path. Access codes are the primary path when a variant is baked in.                                                                                             |
| 2   | **One variant per code**, chosen by the admin at generation time. No multi-variant choice at redemption.                                                                                                                                                                  |
| 3   | **No backfill.** Existing codes keep `variant = null`; they redeem exactly as they do today.                                                                                                                                                                              |
| 4   | **No new permission tier.** Code generation stays admin/staff-only (`apps/adminboard`), as today. All catalog variants are selectable — none excluded.                                                                                                                    |
| 5   | Variant is **orthogonal to `mode`/`trialDays`**. It always just sets `assignedDefaultVariant` on redemption, independent of whether the code is `permanent_free` or `timed_trial`.                                                                                        |
| 6   | Redemption of a variant-carrying code reuses the **same live-paid-subscription guard** as manual assignment. If it trips, **fail the whole redemption** (no partial trial/subscription grant, code stays unused).                                                         |
| 7   | **No audit row** for code-triggered assignment (skip `AdminCustomerAudit` on this path — the new Variant column on the codes list covers traceability).                                                                                                                   |
| 8   | If the code's variant no longer resolves to a complete monthly+yearly Stripe Price pair at redemption time, **fail the variant portion with a clear error** ("this code's plan is no longer available, contact support"); no silent fallback to `basic`.                  |
| 9   | Store the **variant name** (nullable string column on `TrialRedeemCode`, same sparse pattern as `User.assignedDefaultVariant`), resolved against the live catalog at redemption time — not a Price ID snapshot.                                                           |
| 10  | Variant picker in the create-code dialog is **optional**, default "no variant" — existing no-variant codes remain a supported case.                                                                                                                                       |
| 11  | Codes list/table gets a **Variant column**.                                                                                                                                                                                                                               |
| 12  | **No new end-user UI.** No pre-redemption preview, no special post-redemption messaging beyond what the Billing tab already shows.                                                                                                                                        |
| 13  | Applies **identically at both redemption entry points** — sign-up (`trial-redeem-sign-up.ts`) and Profile Billing (`console-access-code-redeem.ts`) — so a brand-new signer-upper gets the variant with zero staff involvement, same as an existing user redeeming later. |

## Current-state facts (from research)

- `TrialRedeemCode` (`packages/db/prisma/models/billing.prisma`): `code`, `status`, `mode` (`permanent_free`|`timed_trial`), `trialDays`, `note`, `usedAt`, `usedBy`. Single-use, no FK to anything variant-related. No stored `expiresAt` (7-day TTL computed from `createdAt`).
- Plan Variants are **not a DB table** — they're Stripe Price pairs (`{name}_monthly`/`{name}_yearly` lookup keys) resolved live into a `PlanVariantCatalog` (`packages/shared/src/utils/billing/plan-variant-catalog.ts`, fetched fresh via `readPlanVariantCatalogFresh` in `packages/auth/src/lib/plan-variant-catalog.ts`). The only persisted trace is `User.assignedDefaultVariant: String?` (sparse; `null` reads as `basic`).
- Manual assignment (`packages/shared/src/utils/admin-customer/assign-plan-variant.ts` → `assignPlanVariantForCustomer`) requires a ≥3-char `reason`, blocks when `canChangeAssignedPlanVariant` finds a live paid Default subscription (`AssignPlanVariantStateError`), resolves the name via `resolvePlanVariantPair`, sparse-writes it (`sparseAssignedPlanVariantWrite`), and always records an `AdminCustomerAudit` row.
- Two redemption entry points share the same domain shape:
  - Sign-up: `packages/shared/src/utils/billing/trial-redeem-sign-up.ts` → `redeemTrialCodeAfterSignUp`, called from `packages/auth/src/lib/trial-redeem.ts` → `redeemTrialCodeForCustomer`, wired at `packages/auth/src/auth-instance.ts:203` (`onCustomerCreate`, `stripeClient`/`userId`/`stripeCustomerId` all in scope).
  - Profile Billing: `packages/shared/src/utils/billing/console-access-code-redeem.ts` → `redeemAccessCodeOnProfile`, called from `packages/auth/src/lib/console-access-code-redeem.ts` → `redeemAccessCodeForUser` (`deps.stripeClient` in scope).
  - Both share `TrialRedeemConsumeStore` (`findByCode`, `consumeAsRedeemed`, `consumeAsAlreadyEntitled`).
- Admin generation: `packages/orpc/src/procedures/trial-redeem-code.ts` (`create` procedure) ← `apps/adminboard/components/trial-redeem-code/create-trial-redeem-code-dialog.tsx`. Listing/table: `apps/adminboard/components/trial-redeem-code/columns.tsx`.
- Existing "list assignable variants" plumbing to reuse: `listAssignablePlanVariantsAction` / `toAssignablePlanVariantOptions` (`packages/auth/src/lib/assign-plan-variant.ts`, `plan-variant-catalog.ts`), already surfaced to the admin app via `admin-customer.listAssignablePlanVariants`.

## Design

### Schema

Add `variant String?` (nullable, sparse — same convention as `User.assignedDefaultVariant`) to `TrialRedeemCode` in `packages/db/prisma/models/billing.prisma`. Generate via `pnpm db:migrate:dev`. No backfill (decision #3).

### Domain: `packages/shared/src/utils/billing/`

- `trial-redeem-code.ts`: add `variant: string | null` to `TrialRedeemCodeRecord`, the store `create` input, and `CreateTrialRedeemCodeInput`. `createTrialRedeemCode` stores whatever normalized name it's given — it does **not** touch Stripe/the catalog itself (kept pure); catalog validation happens one layer up, at the orpc `create` handler, which has `stripeClient`.
- New file `access-code-variant.ts`:

  ```ts
  export type AccessCodeVariantStore = {
    findTargetUser: (userId: string) => Promise<{ id: string } | null>
    listSubscriptions: (
      userId: string,
    ) => Promise<AdminCustomerBillingSubscriptionRow[]>
    updateAssignedPlanVariant: (
      userId: string,
      variantName: string | null,
    ) => Promise<void>
  }

  export type AccessCodeVariantOutcome = 'applied' | 'blocked' | 'unavailable'

  export async function applyAccessCodeVariant(
    store: AccessCodeVariantStore,
    catalog: PlanVariantCatalog,
    input: { userId: string; variantName: string },
  ): Promise<AccessCodeVariantOutcome>
  ```

  Reuses `canChangeAssignedPlanVariant` (blocked case), `resolvePlanVariantPair` (unavailable case), `sparseAssignedPlanVariantWrite` — all already exported — with **no reason, no audit call**. `AccessCodeVariantStore` is a structural subset of the existing `AssignPlanVariantStore`, so the Prisma store built for manual assignment (`createPrismaAssignPlanVariantStore`) can be passed straight in on the auth side.

- `console-access-code-redeem.ts` / `trial-redeem-sign-up.ts`: extend the shared `TrialRedeemConsumeStore` type with `applyVariant: (userId: string, variantName: string) => Promise<AccessCodeVariantOutcome>`. In both `redeemAccessCodeOnProfile` and `redeemTrialCodeAfterSignUp`, right after the gate resolves to `proceed` (before the mode/seat branching, so it applies uniformly regardless of which effect fires — decision #5/#13): if `gate.record.variant` is set, call `store.applyVariant(userId, variant)`.
  - `'blocked'` → profile path throws a new `ConsoleAccessCodeVariantBlockedError`; sign-up path returns `{ status: 'failed' }`.
  - `'unavailable'` → profile path throws a new `ConsoleAccessCodeVariantUnavailableError` ("this code's plan is no longer available, contact support"); sign-up path returns `{ status: 'failed' }`.
  - Either way the code is **not** consumed (matches existing Stripe-failure behavior — code stays `unused`), satisfying "fail the whole redemption" (decision #6/#8).

### Auth wiring: `packages/auth/src/lib/`

- New `access-code-variant.ts`: `createAccessCodeVariantGateway(client, stripeClient)` → `{ applyVariant }`, composing `createPrismaAssignPlanVariantStore(client)` + `readPlanVariantCatalogFresh(stripeClient)` + `applyAccessCodeVariant`.
- `console-access-code-redeem.ts`: `createPrismaConsoleAccessCodeStore` takes `stripeClient` too; spread the gateway's `applyVariant` into the returned store.
- `trial-redeem.ts`: `redeemTrialCodeForCustomer` builds the gateway per-call (it already receives `stripeClient`) and spreads `applyVariant` onto the module-level `trialRedeemStore` for that call — the singleton itself stays Stripe-free since `assertTrialRedeemAllowedAtSignUp` doesn't need it.
- New auth action for the create-code validation path: `resolveAccessCodeVariantName(stripeClient, variantName)` — fetches the catalog fresh, calls `resolvePlanVariantPair`, throws a validation error if it doesn't resolve to a complete pair, otherwise returns the sparse-written name (`null` for `basic`) to store on the code.

### API: `packages/orpc/src/procedures/trial-redeem-code.ts`

- `createInputSchema` gains `variantName: z.string().trim().min(1).optional()`.
- `create` handler: when `variantName` is present, resolve it via `resolveAccessCodeVariantName(stripeClient, variantName)` (imported from `@virtality/auth`, same pattern as `admin-customer.ts`'s use of the module-level `stripeClient`) before calling `createTrialRedeemCode`; on failure, surface as `BAD_REQUEST`.
- `list` already returns full rows (`variant` comes along for free) — no procedure change needed beyond the type picking it up.

### Admin UI: `apps/adminboard/components/trial-redeem-code/`

- `create-trial-redeem-code-dialog.tsx`: add an optional variant `<Select>`, sourced the same way as the existing "Assign Plan variant" dialog (`useAssignablePlanVariants` / `admin-customer.listAssignablePlanVariants`), defaulting to "No variant" (decision #10).
- `columns.tsx`: add a **Variant** column, showing the variant label or "—".

### Explicitly unchanged

- Manual assignment flow, its guard, its audit trail — untouched, remains the fallback.
- Redemption success messaging (`formatAccessCodeAppliedMessage`, `promo-code-entry-form.tsx`, `sign-up.tsx`) — no copy changes; the Billing tab already reflects the assigned variant.
- `sendTrialRedeemCodeEmail` — no variant mention added to the email payload.

## Acceptance checklist

- [ ] `TrialRedeemCode.variant` column exists via a generated (not hand-written) migration.
- [ ] Admin can generate a code with no variant (unchanged behavior) or with exactly one variant selected from the live catalog.
- [ ] Codes list shows the Variant column.
- [ ] Redeeming a variant-carrying code at sign-up sets `User.assignedDefaultVariant` with no staff action, for both `permanent_free` and `timed_trial` modes.
- [ ] Redeeming a variant-carrying code from Profile Billing does the same.
- [ ] Redeeming a variant-carrying code while the user has a live paid Default subscription fails the whole redemption (code stays unused) with a clear error.
- [ ] Redeeming a code whose baked-in variant no longer resolves in the catalog fails the whole redemption with the "no longer available" error.
- [ ] No `AdminCustomerAudit` row is written for code-triggered assignment.
- [ ] Existing codes without a variant redeem unchanged.
- [ ] Manual "Assign Plan variant" dialog and its guard/audit behavior are unaffected.

## Test expectations

- Unit: `applyAccessCodeVariant` — applied / blocked / unavailable outcomes.
- Unit: `redeemAccessCodeOnProfile` and `redeemTrialCodeAfterSignUp` — variant applied across all three effect branches; blocked/unavailable short-circuits before consuming the code.
- Unit: `createTrialRedeemCode` stores the given variant name (or null); orpc `create` handler rejects an unresolvable `variantName`.
- Manual: generate a variant code in Adminboard, redeem at sign-up and via Profile Billing, confirm Billing tab shows the plan with no manual step.
