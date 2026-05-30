# UI System

Shared UI language for reusable components consumed by multiple apps.

## Language

**Shared UI Bucket**:
The canonical set of reusable UI components that live in `packages/ui` and are intended for cross-app reuse.
_Avoid_: Common dump, random shared folder

**Local App UI**:
UI components that remain app-specific and stay within an individual app context (for example `apps/console/components`).
_Avoid_: Shared component, universal component

**Promotion Gate**:
The rule for moving a component from **Local App UI** to the **Shared UI Bucket**: used by at least two apps, free of app-domain logic.
_Avoid_: Ad-hoc move, opportunistic copy

## Primitive Migration Triage

Current duplicate UI primitives with conflicts (not zero-conflict yet):

- `button`
- `calendar`
- `chart`
- `checkbox`
- `combo-select`
- `command`
- `dialog`
- `dropdown-menu`
- `exercise-input-pill`
- `field`
- `form`
- `navigation-menu`
- `popover`
- `select`
- `skeleton`
- `switch`
- `table`
- `tabs`
