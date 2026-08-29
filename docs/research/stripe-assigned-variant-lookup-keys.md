# Research: Stripe lookup_key encoding for Assigned Variant Price pairs

**Date:** 2026-08-29  
**Ticket:** [#187 — Research Stripe lookup_key encoding for Assigned Variant Price pairs](https://github.com/Virtality-app/virtality-platform/issues/187)  
**Map:** [#186 — Assigned Variants for Pro pricing — way to PRD](https://github.com/Virtality-app/virtality-platform/issues/186)  
**Question:** How should we discover Pro Assigned Variant Price pairs from Stripe given the convention `{snake_case_name}_{interval}` (e.g. `basic_monthly`, `early_bird_yearly`)?  
**Sources:** Stripe Price / Products docs (cited inline); in-repo billing catalog and plan id code.  
**Branch:** `research/stripe-assigned-variant-lookup-keys`

## Verdict

Discover variants by listing active recurring Prices on the canonical Pro Product, then group by parsing `lookup_key` as `{name}_{monthly|yearly}`. Amounts come from each Price’s `unit_amount`. Do not hardcode amounts in Adminboard.

Today’s sandbox Pro pair already exists as `pro_monthly` / `pro_yearly` with hardcoded `price_…` ids. That pair should become the required `basic_*` pair by **renaming those lookup_keys in place** on the same Price objects. Creating new Prices for `basic_*` would mint new ids and force a Better Auth / billing-plans constant churn for no gain. Extra variants (`early_bird`, …) are new Prices on the same Product with new lookup_keys.

Nothing in Stripe blocks listing complete monthly+yearly pairs without hardcoded amounts. The real gaps are naming (`pro_*` vs `basic_*`) and the app’s current retrieve-by-hardcoded-id path.

---

## Stripe `lookup_key` (primary docs)

From the [Price object](https://docs.stripe.com/api/prices/object):

- Optional nullable string: “A lookup key used to retrieve prices dynamically from a static string.”
- Max length **200 characters**.
- Not the Price `id`. Subscriptions and Checkout keep using `price_…` ids; lookup_key is for discovery.

Stripe’s product guide ([Manage products and prices → Lookup keys](https://docs.stripe.com/products-prices/manage-prices#lookup-keys)) is the intended use: put a stable string in code/UI, list Prices by that key, bill with the returned Price id. When the charge amount must change, create a **new** Price and move the key with `transfer_lookup_key=true` (amounts are immutable on an existing Price).

Uniqueness is account-wide in practice: only one Price may own a given `lookup_key` at a time. Creating another Price with the same key without `transfer_lookup_key` fails; transfer atomically clears the key from the previous Price.

### What you can change on an existing Price

[Update a price](https://docs.stripe.com/api/prices/update) and the [Edit a price](https://docs.stripe.com/products-prices/manage-prices#edit-a-price) guide:

- **Allowed:** `lookup_key`, `active`, `metadata`, `nickname`, `tax_behavior` (with tax caveats), `currency_options`, `transfer_lookup_key`.
- **Not allowed via update:** `unit_amount` / amount. “You can’t change a price’s amount in the API. Instead, … create a new price … then update the old price to be inactive.”

So renaming `pro_monthly` → `basic_monthly` on the existing Price is a supported in-place update. Changing €150 → something else is not; that needs a new Price + key transfer.

---

## Listing and filtering Prices

### List API (prefer for Adminboard discovery)

[List all prices](https://docs.stripe.com/api/prices/list):

| Parameter             | Role                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `product`             | Only Prices on that Product                                        |
| `active`              | Default list is active only; pass `false` for archived             |
| `type`                | `recurring` or `one_time`                                          |
| `lookup_keys`         | Exact match array, **up to 10** keys                               |
| `recurring[interval]` | Stripe enum `month` / `year` (not our `monthly` / `yearly` suffix) |
| `currency`            | e.g. `eur`                                                         |
| `limit`               | 1–100 (paginate with `starting_after`)                             |

Recommended discovery call for Assigned Variants:

```text
GET /v1/prices?product={PRO_PLAN_PRODUCT_ID}&active=true&type=recurring&limit=100
```

Then in app code:

1. Keep Prices whose `lookup_key` matches `/^(.+)_(monthly|yearly)$/`.
2. Group by capture group 1 (variant name). Parse from the **right** so `early_bird_monthly` → name `early_bird`, interval `monthly`.
3. A complete pair needs both `monthly` and `yearly` for that name, matching intervals on `recurring.interval` (`month` / `year`), and valid `unit_amount` / currency (repo catalog already requires `eur` and positive amount).
4. Incomplete pairs (only one interval) stay out of the assignable catalog, or surface as a staff warning. Map already requires at least `basic` as a complete pair.

`lookup_keys[]` is fine when you already know the names (e.g. resolve `basic_monthly` + `basic_yearly` for Checkout), but it caps at 10 keys and cannot discover unknown variant names. Do not use it as the sole Adminboard catalog scan.

### Search API (optional, weaker for this)

[Search prices](https://docs.stripe.com/api/prices/search) supports query field `lookup_key` ([Search → Query fields for Prices](https://docs.stripe.com/search#query-fields-for-prices)), type string (exact and substring `~`). Example:

```text
product:'prod_SaYNooLgBNvYvA' AND active:'true' AND type:'recurring'
```

Caveats from Stripe Search docs: not for read-after-write; normal lag under a minute, worse in outages; not available in India; rate-limited. Prefer **List** for Adminboard “show me the catalog now.”

There is no List filter for “lookup_key prefix.” Discovery of all variants is product-scoped list + client parse, not a Stripe-native “all keys starting with X.”

---

## How today’s repo maps to a required `basic_*` pair

| Piece                     | Today                                                                | Assigned Variant target                                                                  |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Pro Product               | `prod_SaYNooLgBNvYvA` (`PRO_PLAN_PRODUCT_ID` in `coupon-library.ts`) | Same Product; all variant Prices live here                                               |
| Monthly Price             | `price_1SeVrm4Fc2DAAhEfIWIRZ2v9`, comment `lookup_key: pro_monthly`  | Same Price id; lookup_key should become `basic_monthly`                                  |
| Yearly Price              | `price_1U3f2g4Fc2DAAhEfk5EkH3u1`, comment `lookup_key: pro_yearly`   | Same Price id; lookup_key → `basic_yearly`                                               |
| Free                      | Separate Product / `free_monthly`                                    | Out of Assigned Variant catalog                                                          |
| Better Auth stripe plugin | Hardcoded `priceId` + `annualDiscountPriceId` on plan name `pro`     | Still bills by Price id; plan name `pro` ≠ variant name `basic`                          |
| Console catalog           | `prices.retrieve` those two ids → `unit_amount`                      | Can later resolve by lookup_key or by Assigned Variant pair; amounts already from Stripe |

Code anchors:

- `packages/shared/src/utils/billing-plans.ts` — `PRO_PLAN_MONTHLY_PRICE_ID` / `PRO_PLAN_ANNUAL_PRICE_ID` and comments naming `pro_monthly` / `pro_yearly`.
- `packages/auth/src/auth-instance.ts` — same ids for Checkout; aliases `PRO_PLAN_PRICE_ID`.
- `packages/auth/src/lib/billing-catalog.ts` — retrieves by those ids, never by `lookup_key`.
- `packages/shared/src/utils/billing-catalog.ts` — builds labels from Stripe `unit_amount` (no hardcoded € in the happy path; sandbox fallback only when Stripe is missing).

**Naming collision to keep straight:** Better Auth’s subscription plan name is `pro`. Assigned Variant names are `basic`, `early_bird`, …. The lookup*key prefix is the **variant** name, not the Better Auth plan name. Renaming keys to `basic*\*` does not rename the Better Auth plan.

---

## Rename in place vs new Prices

| Approach                                                                         | Effect                                                                                                                                  | Fit                                                                           |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Update lookup_key** on existing Pro Prices to `basic_monthly` / `basic_yearly` | Same `price_…` ids; subscriptions and hardcoded constants keep working; discovery by convention works                                   | Right path for the default pair                                               |
| **New Prices** with `basic_*` keys (same or different amounts)                   | New ids; must update `billing-plans`, Better Auth plan config, any live Checkout assumptions; old `pro_*` Prices linger unless archived | Only if you intentionally replace the charge amount or want a clean break     |
| **transfer_lookup_key** onto new Prices                                          | Moves the _new_ key onto new Prices after create; old Prices lose the key; amount change story                                          | Use when amounts change later, not for the initial `pro_*` → `basic_*` rename |

Renaming in place is viable and preferred for the required `basic` pair. Dashboard or API:

```text
POST /v1/prices/price_1SeVrm4Fc2DAAhEfIWIRZ2v9  lookup_key=basic_monthly
POST /v1/prices/price_1U3f2g4Fc2DAAhEfk5EkH3u1  lookup_key=basic_yearly
```

After that, update code comments / docs that still say `pro_monthly` / `pro_yearly`. Constants can stay as the same ids until something starts resolving by lookup_key.

New variants: create two Prices on `PRO_PLAN_PRODUCT_ID` with `lookup_key` `early_bird_monthly` and `early_bird_yearly` (and matching `recurring.interval`). No need to touch the basic Price ids.

---

## What would block Adminboard from listing complete pairs without hardcoding amounts

**Not blockers (Stripe):**

- Price objects expose `unit_amount`, `currency`, `recurring.interval`, `lookup_key`, `id`.
- Product filter returns the whole active catalog for that Product.
- Amounts for display and Checkout come from those fields.

**Actual blockers / gotchas:**

1. **Convention not applied yet.** Sandbox still documents `pro_*`. Until keys are renamed (or dual-recognized), a strict `{name}_{monthly|yearly}` scanner looking for `basic` finds nothing for the default pair.
2. **App code never lists by product.** Catalog and Checkout use two hardcoded ids. Adminboard assignment UI needs a new list+group path; it does not exist today.
3. **Incomplete pairs.** Staff can create only one interval in Dashboard. Discovery must require both legs before offering the variant.
4. **Non-conforming Prices on the Pro Product.** Retired or ad-hoc Prices without the suffix pattern must be ignored (or they pollute the picker).
5. **`lookup_keys` cap of 10.** Fine for resolving known pairs; insufficient as the only scan if many variants exist.
6. **Search lag.** Do not rely on Search right after Dashboard edits.
7. **Multi-currency** (map “not yet specified”). List can filter `currency=eur`; multi-currency Prices need an explicit rule later.
8. **Amount immutability.** Staff cannot “edit the pair’s euro amount” on the same Price; they create new Prices and transfer keys if the list price changes.

None of those force hardcoding amounts in Adminboard. They force: rename `pro_*` → `basic_*`, list by Product, parse keys, require complete pairs, read `unit_amount`.

---

## Practical discovery recipe (for the PRD)

1. Author Prices in Stripe Dashboard on `PRO_PLAN_PRODUCT_ID` with lookup*keys `{variant}*{monthly|yearly}`.
2. One-time sandbox/live ops: set existing canonical Pro Price lookup_keys to `basic_monthly` / `basic_yearly` (in-place update).
3. Adminboard catalog API: `prices.list({ product, active: true, type: 'recurring' })` → group → expose `{ name, monthlyPriceId, yearlyPriceId, monthlyMinor, yearlyMinor, … }`.
4. Require `basic` present as a complete pair; other names optional.
5. Assignment stores the variant **name** (sparse; missing ⇒ `basic`). Checkout / Console resolve to the current Price ids (and amounts) via lookup_key or cached catalog read, not via hardcoded euros.
6. Keep Better Auth `pro` plan wired to the basic Price **ids** until Checkout is taught to pick the Assigned Variant pair; renaming keys alone does not break that wiring.

---

## Sources checklist

- [The Price object — `lookup_key`](https://docs.stripe.com/api/prices/object)
- [Create a price — `lookup_key`, `transfer_lookup_key`](https://docs.stripe.com/api/prices/create)
- [Update a price](https://docs.stripe.com/api/prices/update)
- [List all prices — `product`, `lookup_keys` (max 10)](https://docs.stripe.com/api/prices/list)
- [Search prices + query fields for Prices](https://docs.stripe.com/api/prices/search), [Search guide](https://docs.stripe.com/search#query-fields-for-prices)
- [Manage products and prices — Lookup keys / Edit a price / amount immutability](https://docs.stripe.com/products-prices/manage-prices)
- Repo: `packages/shared/src/utils/billing-plans.ts`, `billing-catalog.ts`, `coupon-library.ts` (`PRO_PLAN_PRODUCT_ID`); `packages/auth/src/auth-instance.ts`, `packages/auth/src/lib/billing-catalog.ts`
