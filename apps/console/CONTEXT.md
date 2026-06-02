# Console

Clinician-facing web app for managing patients, building therapy plans, and running rehabilitation workflows.

## Language

**Exercise Family**:
The canonical movement concept independent of side-specific direction (for example, "Active Wrist Extension").
_Avoid_: Base exercise, parent exercise, generic exercise

**Exercise Variant**:
A concrete selectable exercise defined by an **Exercise Family** plus one direction value (for example, Left or Right).
_Avoid_: Child exercise, side item, duplicate exercise

**Direction**:
A laterality or orientation qualifier that differentiates one **Exercise Variant** from another within the same **Exercise Family**.
_Avoid_: Side label, handedness flag

**Direction Set (Near-Term)**:
The allowed direction vocabulary for exercise-program authoring in the near term is Left and Right only.
_Avoid_: Open direction labels, arbitrary direction text

**Family Key**:
The attribute used to identify an **Exercise Family** in the current system. In the console context, this is `displayName`.
_Avoid_: Name key, title key

**Dual-Side Auto-Add**:
Selection behavior where choosing an **Exercise Family** automatically adds both Left and Right **Exercise Variants** when both exist; otherwise, the single available variant is added.
_Avoid_: Implicit pairing, bulk side add

**Grouped Family Entry**:
A selected-program row that represents both side variants of the same **Exercise Family** as one compact entry until side-specific edits require a split.
_Avoid_: Merged duplicate, combined row

**Edit Sides Separately**:
An explicit, always-visible toggle on a **Grouped Family Entry** that lets clinicians switch from unified family settings to side-specific settings for each **Exercise Variant**.
_Avoid_: Auto split, implicit divergence

**Stage-Aware Removal**:
Removal behavior that differs by workflow stage: in library selection, deselect immediately; in the selected-program list, require confirmation only when side-specific settings would be lost. Direction toggles can mark an **Exercise Variant** as disabled and defer actual removal until submit.
_Avoid_: Global confirmation, one-rule removal

**Deferred Direction Removal**:
When a direction is toggled off in the selected-program list, the **Exercise Variant** remains visible with its settings preserved but read-only until re-enabled; persisted removal happens only on submit in both program creation and program editing flows.
_Avoid_: Immediate direction delete, hidden pending removal

**Deferred Removal Marker**:
Client-side pending-removal state for an **Exercise Variant** is keyed by selected-row identity (`CompleteExercise.id`), not catalog identity (`exerciseId`).
_Avoid_: exerciseId-based pending removal keys

**Bulk Selection Scope**:
**Exercise Variants** marked for deferred removal are excluded from bulk selection controls (`Select all`, segment checkbox aggregation, and `Remove Selected`).
_Avoid_: Bulk actions that include pending-removal variants

**Disabled Family Visibility**:
When both Left and Right **Exercise Variants** of a family are marked for deferred removal, the family row remains visible in a disabled state until submit.
_Avoid_: Immediate row collapse for fully disabled families

**Deferred Removal Retry Semantics**:
If submit fails, deferred-removal markers remain unchanged in the UI so clinicians can retry without rebuilding selection intent.
_Avoid_: Clearing pending-removal state on failed submit

**Deferred Removal Styling**:
Deferred-removal **Exercise Variants** are communicated with muted styling only (no explicit status badge text).
_Avoid_: Extra textual pending-removal labels

**Deferred Toggle Reversibility**:
Re-enabling a deferred-removal **Exercise Variant** restores it exactly as-is, preserving both its prior settings and its position in the selected-program list.
_Avoid_: Re-enable reset, reinsert-at-end behavior

**Enabled-Only Submit Guard**:
Submit is blocked when no enabled **Exercise Variants** remain, and validation feedback is shown as a toast.
_Avoid_: Allowing zero-enabled submit

**Disabled Row Reorder Guard**:
When a grouped family row is fully in deferred-removal state, its reorder controls are disabled.
_Avoid_: Reordering fully deferred-removal rows

**Deferred-Removal Scope (Current)**:
Deferred removal applies to direction-toggle interactions in the selected-program list; `Remove Selected` remains immediate-delete behavior.
_Avoid_: Broad removal-semantics changes in the same iteration

## Example Dialogue

Dev: "Should we list every **Exercise Variant** directly in the picker?"  
Domain expert: "No, start from **Exercise Family** first so the list stays compact."

Dev: "How do we identify a family in the current data model?"  
Domain expert: "Use `displayName` as the **Family Key** for now."

Dev: "When a family has Left and Right, what gets added?"  
Domain expert: "Use **Dual-Side Auto-Add**, then show it as a **Grouped Family Entry** unless side settings diverge."

Dev: "How does a clinician apply different settings to Left and Right?"  
Domain expert: "They use **Edit Sides Separately** from the grouped row when they need side-specific control."

Dev: "When should removal ask for confirmation?"  
Domain expert: "Use **Stage-Aware Removal** so we stay fast in selection and safe in settings."

Dev: "Do we support more direction labels right now?"  
Domain expert: "No, use the **Direction Set (Near-Term)** of Left and Right."
