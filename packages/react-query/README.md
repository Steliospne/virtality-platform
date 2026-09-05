# @virtality/react-query

TanStack Query hooks and provider for the Virtality oRPC API. Use this package in any app (console, website, etc.) to avoid duplicating hook and client setup. **SSR-safe** when using `ORPCProvider` + `useORPC()`.

## Setup (SSR-safe, recommended for Next.js)

1. **Install** the package in your app (e.g. `apps/console`):

   ```bash
   pnpm add @virtality/react-query
   ```

2. **Wrap your app** with `QueryProvider` and `ORPCProvider`. Pass only the API `url` (and optional `credentials`) so the layout can stay a Server Component—the link is built inside the client.

   ```tsx
   import { QueryProvider, ORPCProvider } from '@virtality/react-query'
   import { ORPC_PREFIX } from '@virtality/shared/types'

   const baseURL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:8080'

   export default function RootLayout({ children }) {
     return (
       <QueryProvider>
         <ORPCProvider url={baseURL + ORPC_PREFIX} credentials='include'>
           {children}
         </ORPCProvider>
       </QueryProvider>
     )
   }
   ```

3. **Use the hooks** anywhere in your app (they read orpc from context):

   ```tsx
   import {
     usePatients,
     usePatient,
     useCreatePatientSession,
   } from '@virtality/react-query'
   ```

## Alternative: client-only (configureORPC)

If you are not using SSR and only run in the browser, you can call `configureORPC(link)` once at app entry (e.g. in `instrumentation.ts` or a client bootstrap). Then hooks and `getORPC()` both use the singleton. This is **not** safe for concurrent server requests.

## Cache invalidation

Inside React components, use **`useORPC()`** (SSR-safe):

```tsx
import { useORPC } from '@virtality/react-query'
import { useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  queryClient.invalidateQueries({ queryKey: orpc.patient.list.key() })
}
```

Outside React (e.g. in callbacks after ORPCProvider has mounted on the client), **`getORPC()`** still works and returns the same utils.

## Exports

- **Config:** `configureORPC`, `getORPC`, `ORPCUtils`
- **SSR:** `ORPCProvider`, `useORPC`, `ORPCProviderProps`
- **Provider:** `getQueryClient`, `QueryProvider`
- **Query hooks:** `useUserName`, `useIsUserVerified`, `useReusablePrograms`, `useStarterTemplates`, `useAvatar`, `useExercise`, `useMap`, `useMedicalHistory`, `useSupplementalTherapyQuery`, `useCreateSupplementalTherapyRelMutation`, `usePatient`, `usePatients`, `usePatientSession`, `usePatientSessions`, `useDeviceCore`, and others (see `src/hooks/queries/index.ts`)
- **Mutation hooks:** reusable-program, reusable-program-exercise, patient, patient-session, patient-session-data, patient-session-exercise, device, and others (see `src/hooks/mutations/index.ts`)

## Device hook

`useDeviceCore` returns device list query and create/delete mutations with cache invalidation only. For socket/VRDevice logic (e.g. in the console app), keep a local wrapper that uses `useDeviceCore` and adds app-specific behavior.
