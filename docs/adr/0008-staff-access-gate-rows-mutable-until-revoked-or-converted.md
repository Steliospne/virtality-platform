# Staff-managed Access Gate rows are mutable until revoked or converted

Designing Adminboard's Access Gate actions (replacing "Assign permanent Free"; map #250, ticket #253) required deciding how staff toggle a customer between Permanent and Timed access. #251/#252 had established that an Access Gate's mode (Permanent vs Timed, derived from whether `trialEnd` is set) is fixed for a row's lifetime, so that self-serve Access Code redemption could always insert a fresh row without ambiguity — letting a Timed gate layer on top of an existing Permanent one. Carrying that same rule into the staff surface would mean a customer could end up with two simultaneous open rows from admin actions too, which left no unambiguous target for a "Revoke" button and no real product need surfaced for staff-driven layering.

## Decision

For staff (Adminboard) actions only, a customer has at most one open Access Gate row at a time, and that row is mutable in place until it is `revoked` or `converted`:

- "Assign Access" sets the open row's `trialEnd` to `null` (creating a row if none is open).
- The merged trial action ("Issue Trial Access" / "Extend Trial Access", one control with a dynamic label) sets or extends the open row's `trialEnd` (creating a row if none is open).
- Both are blocked only when the customer's Access Gate is `converted`. A `revoked` row is not open, so staff can freely issue a fresh one afterward, same as a customer who never had a gate.
- "Revoke" is the only action that ends a row's mutability — it always has exactly one unambiguous target.

Self-serve Access Code redemption (#252) is unchanged: it still always creates a new row and never mutates an existing one, so the "mode fixed for lifetime" invariant continues to hold there.

## Consequences

- A customer can still end up with two open rows if a staff-issued row and a self-serve redemption row coexist (e.g. staff grants a Permanent gate, then the clinician separately redeems a Trial Access Code). This is accepted as a rare edge case, not eliminated — Adminboard's single-row action set degrades to listing both rows if this happens, rather than being designed around it.
- `packages/shared/src/utils/billing/trial-grant.ts`'s `adjustTrialGrantForCustomer`/`issueTrialGrantToCustomer`/`revokeTrialGrantForCustomer` and Adminboard's singular `profile.trialGrant` read model are replaced by an Access-Gate-native equivalent built around "the customer's one open gate," not a fixed-mode record.
