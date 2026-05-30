# UI System

Shared UI language for reusable components consumed by multiple apps.

**Phase 1 (PRD #14)** is complete: `label`, `spinner`, `input`, `textarea`, `separator`, `badge`, and `card` live in `@virtality/ui` with canonical import enforcement. See `CONTRACT.md`.

## Language

**Shared UI Bucket**:
The canonical set of reusable UI components that live in `packages/ui` and are intended for cross-app reuse.
_Avoid_: Common dump, random shared folder

**Local App UI**:
UI components that remain app-specific and stay within an individual app context (for example `apps/console/components`).
_Avoid_: Shared component, universal component

**Promotion Gate**:
The rule for moving a component from **Local App UI** to the **Shared UI Bucket**: used by at least two apps, free of app-domain logic, and differing only by theme-token styling.
_Avoid_: Ad-hoc move, opportunistic copy

**Deprecated Local UI Component**:
A renamed local component retained temporarily during migration after a shared replacement exists in `packages/ui`.
_Avoid_: Permanent fallback, legacy default

**Shared UI Ownership**:
Joint ownership by the console and website contexts for behavior and visual contract decisions in `packages/ui`.
_Avoid_: Single-app ownership, ownerless shared layer

**Canonical Shared UI Import**:
The required app import path for promoted shared components is `@virtality/ui/components/<name>` instead of local `@/components/ui/<name>` paths.
_Avoid_: Local wrapper indirection, mixed import strategy

**Token Contract**:
The documented set of semantic styling tokens that shared components rely on, while each app keeps concrete token values in its own `globals.css`.
_Avoid_: Hardcoded app colors in shared components, undocumented token dependency

**Priority App Pair**:
The primary UX-preservation targets for shared-component decisions are the console and website apps; adminboard may adapt visually.
_Avoid_: Equal visual priority across all apps

**Phase-1 Shared Batch**:
The first promotion set for the Shared UI Bucket: `label`, `spinner`, `input`, `textarea`, `separator`, `badge`, and `card`.
_Avoid_: Big-bang migration of all common components at once
