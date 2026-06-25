# Console

Clinician-facing web app for managing patients, building therapy plans, and running rehabilitation workflows.

## Language

**Reusable Program**:
A clinician-owned therapy program template that can be used with any of that clinician's patients. It belongs to the clinician's library, not to a patient.
_Avoid_: Global program, preset, patient program, assigned program, generic program

**Session Exercise Snapshot**:
The exercise list and settings of a patient session once the session is completed, including any live clinician changes made during the session.
_Avoid_: Starting program copy, active program, program exercise history

**Session Working Copy**:
The persisted, mutable exercise list and settings used during an active patient session. Changes to it do not change the **Reusable Program** unless the clinician explicitly saves them back or saves them as a new **Reusable Program**.
_Avoid_: Editing the program live, implicit program update

**Session Completion Save Choice**:
The end-of-session decision to either finish without changing the **Program Library**, update the source **Reusable Program**, or save the final **Session Working Copy** as a new **Reusable Program**.
_Avoid_: Autosave to program, live save prompt

**Quick Start**:
An ad hoc treatment path that starts a patient session without choosing a **Reusable Program** first.
_Avoid_: Blank program, temporary program

**Catalog-First Authoring**:
Program authoring and editing flows that open on the exercise catalog, then proceed to the selected **Program Exercise** list/settings step. **Quick Start**, scratch **Reusable Program** creation, **Starter Template** creation, and **Reusable Program** editing all follow this two-step model. The catalog step is for discovery and selection; the selected-list step is for tuning, naming, and final actions. Selection and settings persist when navigating back to the catalog.
_Avoid_: Selected-list-first authoring, nested Exercise Library dialog, parallel exercise-picker paths

**Session Launch Attempt**:
The period after a clinician asks the VR to start treatment but before the VR confirms that treatment has started.
_Avoid_: Patient session, started session

**Started Session**:
A patient session that begins only after the VR confirms the treatment start.
_Avoid_: Button press, launch attempt

**Interrupted Session**:
A **Started Session** that ended unexpectedly before normal completion. It is not treated as completed clinical history.
_Avoid_: Completed session, failed launch

**Session Progress Record**:
Exercise performance data captured during a **Started Session** and persisted incrementally as treatment progresses.
_Avoid_: End-only session data, temporary progress

**Program Exercise**:
An exercise and settings entry that belongs to a **Reusable Program**. It represents reusable treatment intent, not patient history.
_Avoid_: Preset exercise, session exercise, exercise settings row

**Last Used Program**:
The most recently selected **Reusable Program** for a patient, used only as a convenience default when returning to that patient's dashboard.
_Avoid_: Current program, assigned program, patient program

**Program Library**:
The clinician's collection of **Reusable Programs** available for treatment workflows.
_Avoid_: Presets page, template manager

**Retired Program**:
A **Reusable Program** that no longer appears for future treatment selection but remains available for historical session context.
_Avoid_: Deleted program, removed program

**Starter Template**:
A system-provided starting point for creating a clinician-owned **Reusable Program**. It is not selected directly during treatment, and clinicians preview its included exercises before using it.
_Avoid_: Preset, system program, Virtality program

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

Dev: "Should clinicians see an empty selected list before they can pick exercises?"  
Domain expert: "No, use **Catalog-First Authoring** so exercise selection always starts in the catalog."

Dev: "Can they still open a separate Exercise Library dialog from the settings step?"  
Domain expert: "Not in **Catalog-First Authoring** flows — go back to the catalog to add or remove exercises."
