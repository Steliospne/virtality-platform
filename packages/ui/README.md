# @virtality/ui

Shared UI Bucket (`components/`) and React Email templates (`components/email/`).

## Documentation

- [CONTRACT.md](./CONTRACT.md) — promotion rules, imports, tokens, ownership
- [CONTEXT.md](./CONTEXT.md) — package boundary and consumers

## Imports

```ts
import { PHASE_1_COMPONENTS, canonicalSharedImport } from '@virtality/ui/contract'
import { cn } from '@virtality/ui/lib/cn'
import { Label } from '@virtality/ui/components/label'
```

Phase 1 (`PHASE_1_COMPONENTS`) is fully promoted — see [CONTRACT.md](./CONTRACT.md#phase-1-delivery-complete).

## Scripts

- `pnpm build` — compile to `dist/`
- `pnpm type-check` — TypeScript
- `pnpm test` — contract and utility tests
