# Tailwind class names

Build every `className` with the `cn` helper (`clsx` + `tailwind-merge`, exported from each app's `lib/utils.ts` and from `@virtality/ui/lib/utils`), not template literals, `+` concatenation, or `.join(' ')`.

```tsx
// Wrong
className={`rounded px-2 py-0.5 ${active ? 'bg-teal-100' : 'text-zinc-500'}`}

// Right
className={cn('rounded px-2 py-0.5', active ? 'bg-teal-100' : 'text-zinc-500')}
```

`cn` isn't cosmetic: `tailwind-merge` resolves conflicting utilities (two `text-*` classes, a caller-supplied override) the way a plain string never can — the last one wins instead of both landing in the DOM. A hand-built template literal skips that resolution even when nothing looks conditional today.

Import path is `@/lib/utils` inside `apps/console`, `apps/adminboard`, and `apps/website`; `@virtality/ui/lib/utils` (or the local re-export) inside `packages/ui`.

Exception: CSS-module class names (`styles.ring`, `styles.crystal`) aren't Tailwind utilities, so `cn`/`tailwind-merge` has nothing to resolve — plain template literals or string concatenation are fine there.
