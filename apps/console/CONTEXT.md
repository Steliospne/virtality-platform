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
Removal behavior that differs by workflow stage: in library selection, deselect immediately; in the selected-program list, require confirmation only when side-specific settings would be lost.
_Avoid_: Global confirmation, one-rule removal

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
