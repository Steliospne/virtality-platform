# Defer the Organization Feature

Console shipped an early, unfinished Organization feature: a console org list/profile UI backed by direct `prisma.organization.*` reads and writes in `lib/actions.ts` and two `page.tsx` routes, a `better-auth` `organization()` plugin registration in the shared `packages/auth` instance, and matching `organizationClient()` registrations in console and adminboard's auth clients. None of it was reachable from primary navigation, the "Organizations" profile tab rendered no real content, and `createOrganizationAction`/`createInvitationAction` had their calls into the `auth.api` organization plugin commented out — the migration from raw Prisma calls to the plugin was started and abandoned mid-way.

This ADR records that the feature is deliberately shelved, not merely deleted by oversight.

## Decision

Removed from console, adminboard, and `packages/auth`:

- Console routes `organization/[id]` and `user/[id]/organizations`, and `components/organization/*`.
- Organization actions in `lib/actions.ts` (`createOrganizationAction`, `updateOrganizationAction`, `deleteOrganizationAction`, `createInvitationAction`).
- `Organization`/`OrganizationWithMembers`/`OrganizationMember` types and schemas in `lib/definitions.ts`.
- The "Organizations" profile tab (`lib/profile-tab-navigation.ts`, `profile-tabs.tsx`, `profile-skeleton.tsx`).
- The `organization()` plugin from `packages/auth/src/auth-instance.ts`, and `organizationClient()` from console's and adminboard's `auth-client.ts` (both were dead registrations once the feature UI was gone).

Kept: the `Organization`, `Member`, and `Invitation` Prisma models/tables. The feature is expected to return later; when it does, it should be built against the `better-auth` `organization()` plugin's `auth.api.*` surface from the start rather than direct Prisma access, closing the authorization gaps the old code had (e.g. `deleteOrganizationAction` performed no membership/role check on the caller).

## Rejected alternative

Finish wiring the abandoned `auth.api.createOrganization`/`createInvitation` calls instead of deleting. Rejected because the feature has no current product owner or spec, and shipping it now was out of scope for this pass — reviving unfinished authorization-sensitive code without a spec risks the same gap it already had.

## Consequences

- No organization UI or actions exist in console or adminboard today. Reintroducing the feature is new work, not a bug fix.
- The `Organization`/`Member`/`Invitation` tables remain in the schema unused by application code; they are not orphaned by accident, they're a deliberate placeholder for the deferred feature.
- A future architecture review should not re-flag the removed direct-Prisma pattern as unaddressed technical debt — it no longer exists.
