# Dropdown → Dialog pointer-events

## Problem

Opening a Radix `Dialog` from a `DropdownMenu` item while the menu is still open leaves two modal layers managing `document.body` styles (especially `pointer-events`). After the dialog closes, the page can remain unclickable until a full reload.

First seen in bucket object/folder actions (GitHub #34, fixed in `affd9b40`). The same bug appeared when opening the email draft archive and preview dialogs from the draft header menu.

## Required pattern

Whenever a dropdown menu item opens a dialog (or otherwise mounts another modal overlay):

1. **Control the dropdown** with `open` / `onOpenChange` state.
2. **Set `modal={false}`** on `DropdownMenu` so the menu does not stack a second modal layer.
3. **Use `onSelect`**, not `onClick`, on `DropdownMenuItem` (Radix menu semantics).
4. **Close the menu before opening the dialog** — call the dialog action via `scheduleAfterDropdownClose` or the `useDropdownMenu` / `useDropdownMenuAction` hooks.

```tsx
const { open, setOpen, runAfterClose } = useDropdownMenu()

return (
  <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
    <DropdownMenuItem onSelect={() => runAfterClose(() => setDialogOpen(true))}>
      Archive
    </DropdownMenuItem>
  </DropdownMenu>
)
```

For row-scoped actions (bucket browser), use `useDropdownMenuAction(item)` which wraps the same helper.

## Where this is applied

| Location | Hook / helper |
| --- | --- |
| `components/bucket/bucket-browser.tsx` | `useDropdownMenuAction` |
| `components/email/admin-email-draft-header-menu.tsx` | `useDropdownMenu` |

## Checklist for new dropdown + dialog UI

- [ ] Dropdown is controlled (`open` / `onOpenChange`)
- [ ] `modal={false}` on `DropdownMenu`
- [ ] Dialog-opening items use `onSelect` + `runAfterClose` / `openDialogAction`
- [ ] Manually verify: open dialog from menu, close dialog, confirm the page accepts clicks

## References

- `lib/schedule-after-dropdown-close.ts` — closes menu, then `requestAnimationFrame` the follow-up
- `hooks/use-dropdown-menu-action.ts` — `useDropdownMenu` and `useDropdownMenuAction`
- `lib/schedule-after-dropdown-close.test.ts` — unit test for close-then-action ordering
