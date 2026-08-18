# UI composition

Compose each UI surface from small files. One **concern** per file, wired by a thin **composer**.

## When writing UI

1. Name the concerns on the surface: each visual region, dialog, table, form, banner, local hook, and display-helper cluster.
2. Put each concern in a **sibling** file in the folder the feature already uses.
3. Leave the composer as imports plus layout.
4. Recheck every `.tsx` you created or grew against the budget and the one-component rule.

**Done when** every concern has its own file, every `.tsx` you created or grew is within budget (or is an exception below), and the composer defines only one JSX component.

## Concern

A **concern** is one named piece of UI or the state behind it:

- a visual region (rail, table, card, dialog, form, banner, toolbar)
- a hook of local state and effects
- a cluster of display or format helpers

**Export one JSX component per file.** A second function that returns JSX is a sibling file of its own, in the same change.

A tiny presentational fragment may stay in the composer when it has no hooks, no independent state, and only a few lines of markup. Extract as soon as it earns a name, state, or dense markup.

When you edit an oversized file, extract the concern you are changing into a sibling as part of that change.

## Budget

- Stay at or under **250 lines** for every `.tsx` you create or grow.
- Extract a sibling **before** adding to a file already over **200 lines**.
- A file over 250 lines is allowed only when it is still one concern (a single form, a generated primitive, or a catalog) and still exports one JSX component.

## Placement

Put siblings in the folder the feature already uses: a route `_components/` directory, `components/<feature>/`, or a website `sections/<section>/`. Website section layout stays in `apps/website/CONTEXT.md`.

Move local state into a colocated `use-*.ts`. Move formatters and pure helpers into a colocated `.ts`. Colocate `*.test.ts` next to the helper they cover.

A hook that owns two concerns becomes two hooks.

```
components/coupon-library/
  coupon-library-workspace.tsx      # composer: layout and wiring
  coupon-library-top-rail.tsx       # one region
  selected-coupon-actions.tsx       # one region
  coupon-promotion-code-table.tsx   # one region
  use-coupon-library-workspace.ts   # local state
```

## Exceptions

These files may exceed budget and may keep a dense body:

- generated primitives under `packages/ui` and app `components/ui` shadcn copies
- SVG or path catalogs
- static data modules
