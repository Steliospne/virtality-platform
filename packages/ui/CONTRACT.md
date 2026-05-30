# Shared UI contract

`@virtality/ui` is the **Shared UI Bucket** for reusable primitives and app-agnostic composites. App-domain widgets stay in **Local App UI** (`apps/<app>/components/ui/`).

Parent PRD: GitHub #14.

## Glossary

| Term | Meaning |
| --- | --- |
| **Shared UI Bucket** | Canonical reusable UI in `@virtality/ui` |
| **Local App UI** | App-scoped components under `apps/<app>/components/ui/` |
| **Promotion Gate** | Criteria a component must meet before entering the shared bucket |
| **Canonical Shared UI Import** | `@virtality/ui/components/<name>` — required for promoted components |
| **Token Contract** | Shared code uses semantic tokens; apps own concrete values in `globals.css` |
| **Shared UI Ownership** | Behavior/visual contract decisions owned jointly by console + website |
| **Deprecated Local UI Component** | Legacy local file kept temporarily during migration |
| **Priority App Pair** | Console + website — default behavior reference for promotions |

## Promotion Gate

Promote a component only when **all** are true:

1. Used by at least two apps (console, website, or adminboard).
2. No app-domain logic (routing, data fetching, clinical/admin workflows).
3. Visual differences are explainable via theme tokens only — not hardcoded app colors.

Defer overlay/select/menu-class components when migration risk is high.

## Canonical imports

```ts
import { Label } from '@virtality/ui/components/label'
```

- **Do** import promoted components from `@virtality/ui/components/<name>`.
- **Do not** add new imports from `apps/<app>/components/ui/<name>` for promoted components.
- **Do** record the component in `PROMOTED_COMPONENTS` (`@virtality/ui/contract`) when promotion completes.

Machine-readable helpers: `canonicalSharedImport`, `PHASE_1_COMPONENTS`, `PROMOTED_COMPONENTS`.

## Token contract

Shared components:

- Use semantic Tailwind classes (`bg-background`, `text-foreground`, `border-border`, …) — see `SEMANTIC_TOKEN_CLASSES` in `@virtality/ui/lib/semantic-tokens`.
- Must **not** reference app-specific palette tokens (e.g. `vital-blue-*` in console-only branding).
- May use layout/typography utilities (`text-sm`, `font-medium`, `rounded-md`) where not app-branded.

Each app maps semantic tokens in `app/globals.css` (`@theme inline`). Shared code never embeds concrete color values.

## Ownership and conflict resolution

- **Shared UI Ownership**: console + website own promoted behavior and variant contracts.
- **Default**: When implementations diverge, prefer console unless website has a documented UX reason.
- **Adminboard**: Must remain functionally correct; visual drift is acceptable.

Declare the behavior source in promotion PR descriptions.

## Phase 1 batch

`label`, `spinner`, `input`, `textarea`, `separator`, `badge`, `card` — see `PHASE_1_COMPONENTS`.

Breaking API convergence is allowed during phase 1 when needed for a single canonical contract.

## Migration lifecycle

1. Add shared implementation under `packages/ui/src/components/<name>.tsx`.
2. Rewire all consumers to canonical imports.
3. Mark local copies as deprecated (file comment + optional `deprecated` re-export shim).
4. Append `<name>` to `PROMOTED_COMPONENTS`.
5. Run full monorepo `npm run typecheck` and `npm run build`.

Enforcement (GitHub #20): ESLint `no-restricted-imports` in app configs (`@virtality/eslint-config/shared-ui`) plus contract tests in `packages/ui/src/contract/enforcement.test.ts` guard canonical imports and deprecated re-export-only shims.

## Phase 1 delivery (complete)

Parent PRD GitHub #14. Implementation slices #15–#20:

| Slice | Issue | Deliverable |
| --- | --- | --- |
| Contract + tokens | #15 | `CONTRACT.md`, semantic token baseline, `PHASE_1_COMPONENTS` |
| label, spinner | #16 | Shared primitives + consumer rewiring |
| input, textarea | #17 | API convergence + behavior tests |
| separator, badge | #18 | Token-aligned promotions |
| card | #19 | App-agnostic composite |
| Import enforcement | #20 | `@virtality/eslint-config/shared-ui` + enforcement tests |

`PROMOTED_COMPONENTS` matches `PHASE_1_COMPONENTS`. Console, website, and adminboard retain **Deprecated Local UI Component** re-export shims until a later cleanup phase. Further promotion uses the same Promotion Gate; overlay/select/menu classes remain deferred per PRD.

### Phase 1 verification

- [x] All phase-1 components listed in `PROMOTED_COMPONENTS`
- [x] Canonical imports enforced (ESLint + contract tests)
- [x] Deprecated re-export shims in all three consumer apps
- [x] Monorepo type-check and test suite green

## Implementer checklist

- [ ] Component passes Promotion Gate
- [ ] Shared file has no app imports (`@/`, app-specific env, domain types)
- [ ] Styling uses semantic tokens only
- [ ] All three apps consume via `@virtality/ui/components/<name>`
- [ ] `PROMOTED_COMPONENTS` updated
- [ ] Monorepo type-check + build green

## Package layout

```
packages/ui/src/
  components/          # promoted web UI (+ email/ for React Email)
  contract/            # promotion registry and import helpers
  lib/
    cn.ts              # class merge for shared components
    semantic-tokens.ts # allowed semantic token classes
```
