# Handoff: Profile Billing (tester → paid + yearly)

**Status:** Prototype in progress. UI variant not chosen yet. Keep all three variations until a winner is picked.

**Prototype location:** `apps/console/app/(app)/user/[id]/profile/_components/prototype-billing/`

**Run:** `pnpm prototype:billing` → sign in → `/user/<id>/profile?variant=A` → **Billing** tab (dev-only).

---

## Question this work answers

How do existing users (many treated as **testers**, with a Stripe Customer but no Subscription) self-serve into paying Pro, including a **yearly** option?

---

## Decisions (agreed)

### Product surface

- Primary conversion surface: **Profile → Billing**, not the sidebar Subscribe/Renew CTA.
- Sidebar Subscribe/Renew stays for soft-expired seats that already have **Billing Path Established**.
- Testers today bypass waitlist by **role**, often with `stripeCustomerId` but **no** synced Subscription. That hides Checkout (`checkoutCta` requires Billing Path). Billing must allow starting Checkout when a Customer exists even if Billing Path is not established yet.

### Catalog / Stripe

- One Product: **Pro**. Two Prices: monthly (`pro_monthly` / existing) and yearly (`pro_yearly`, to create).
- Not a second tier. Interval is a billing variant on the same plan.
- Wire Better Auth Stripe as:

  ```ts
  plans: [{
    name: 'pro',
    priceId: /* monthly: price_1SeVrm4Fc2DAAhEfIWIRZ2v9 / pro_monthly */,
    annualDiscountPriceId: /* yearly: price_1U3f2g4Fc2DAAhEfk5EkH3u1 / pro_yearly (sandbox, provisional €1500) */,
  }]
  ```

- Checkout: `authClient.subscription.upgrade({ plan: 'pro', annual: true | false, … })`.
- **Trial Redeem** and **Adminboard Extension** no-card Trial Subscriptions keep using the **monthly** Price only.
- Do not invent a second Customer; reuse the existing `stripeCustomerId`.

### Staff vs self-serve

- **Trial Redeem (`PAY-…`)**: sign-up only. Do not reuse for existing accounts.
- **Extension**: staff path to grant / lengthen Entitlement Clock (including creating a no-card Trial Subscription for never-entitled Customers). Fine for exceptions and bulk staff grants; wrong as the only path for “users who want to pay.”
- Willing testers convert via Profile Billing → Checkout.

### Entitlement Clock

- No special yearly clock. `active` continues to use `periodEnd` (longer for yearly).
- Subscribe vs Renew still follows paid history, not interval.
- After Checkout succeeds and webhooks sync a Subscription, Billing Path is established; later expiry can keep using existing Subscribe/Renew behavior.

### UI decisions already locked (apply to whichever variant wins)

- **Yearly pricing display:** lead with monthly equivalent (e.g. `€74 / month`); show the yearly total muted underneath (e.g. `€890 / year`).
- **Do not show role** in Billing UI (no Tester badge, no Role row, no “tester access” headline). Role may remain in scenario tooling / server logic only.
- Prototype amounts are placeholders until real Prices are set.

### Prototype variants (keep for now)

Do **not** delete A/B/C until a design pick is recorded here.

| Key | Name                    | Intent                                                                  |
| --- | ----------------------- | ----------------------------------------------------------------------- |
| A   | Stacked plan cards      | Marketing-style: status, two large Monthly/Yearly cards, full-width CTA |
| B   | Split status + interval | Settings density: standing left, radios + CTA right                     |
| C   | Compact receipt row     | Minimal: one Pro row, interval toggle, footer CTA                       |

Switcher: amber bar or ← →; `?variant=A|B|C`. Scenario dropdown is prototype-only.

---

## Open (not decided)

- Which UI variant (or mash-up) ships.
- Exact monthly / yearly amounts and Stripe Price IDs (sandbox + live).
- Whether successful paid Checkout **clears `tester` → clinician** (recommended, not locked).
- Customer Portal in v1 vs Subscribe-only first.
- Stripe Tax / registrations for Checkout (needed before charging US/EU for real).

---

## Suggested implementation order (after variant pick)

1. ~~Create yearly Price on existing Pro product (`lookup_key: pro_yearly`); wire `annualDiscountPriceId` in `packages/auth`.~~ Done (sandbox: `price_1U3f2g4Fc2DAAhEfk5EkH3u1`, provisional €1500/year).
2. ~~Extend console Checkout helper to accept `annual: boolean` (today hardcodes monthly `pro`).~~ Done.
3. ~~Allow Checkout when `stripeCustomerId` exists without prior Subscription.~~ Done (`resolveProfileBillingCheckoutCta`).
4. Ship Profile → Billing (winning UI); gate off prototype switcher / losing variants.
5. Optional: demote tester on first paid Subscription; Customer Portal; demote prototype tab from default.

---

## Domain reminders (existing)

From console / adminboard language:

- **Billing Path Established:** ≥1 synced local Subscription for the Customer (any status). Customer id alone is not enough.
- **Entitlement Clock:** gates VR launch; soft-expiry does not alone waitlist when Billing Path exists.
- Testers / admins bypass waitlist by role today.

---

## Capture rule

When a variant is chosen: write the winner + why in this file, fold that UI into the real Billing tab, move or delete losing prototype variants from `dev` / main per the prototype skill (keep full set on a throwaway branch if useful as primary source).
