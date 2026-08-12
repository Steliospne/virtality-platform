# PROTOTYPE: Profile Billing

Throwaway UI. Answers: what should Profile → Billing look like for tester→paid conversion with Monthly vs Yearly Pro?

**Keep all three variants until a winner is chosen.** Decisions and open questions live in [HANDOFF.md](./HANDOFF.md).

## Run

```bash
pnpm prototype:billing
```

Sign in, open `/user/<id>/profile?variant=A`, use the **Billing** tab.

- `?variant=A` Stacked plan cards
- `?variant=B` Split status + interval
- `?variant=C` Compact receipt row

Amber bar or ← → cycles variants. Scenario select exercises tester / expired / active / canceled. Checkout is stubbed via `buildProCheckoutUpgradeInput` (monthly/yearly `annual`
flag). No Stripe redirect.

Yearly shows as monthly-equivalent with muted yearly total. Role is not shown in the Billing UI.

Dev-only: Billing tab and switcher are hidden in production builds.
