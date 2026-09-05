# Doppler secrets (Virtality)

Canonical secrets live in **Doppler**. Local `.env` files are generated or injected from Doppler; they are never committed.

Related: [Machine setup](./machine-setup.md), [Onboarding](./README.md), [Secret vault research](../research/secret-vaults-local-dev.md).

Official docs: [CLI](https://docs.doppler.com/docs/cli), [Workplace structure](https://docs.doppler.com/docs/workplace-structure), [Setting secrets](https://docs.doppler.com/docs/setting-secrets).

---

## Mental model

| Doppler term  | Meaning for us                                                                 |
| ------------- | ------------------------------------------------------------------------------ |
| **Workplace** | Virtality company account                                                      |
| **Project**   | One deployable unit (app or service), or a shared secrets bucket               |
| **Config**    | Environment slice: `dev`, `stg`, `prd` (plus optional personal/branch configs) |
| **Secret**    | One env var name + value in a config                                           |

This monorepo maps **one Doppler project per path** that already has a `.env.example`. Other git repos get their own project prefix (see naming below).

All 7 projects below already exist in the Virtality workplace, each with `dev`/`stg`/`prd` configs matching the workplace default environments (confirmed via the Doppler MCP), and the local `.env` migration into `dev` is done. What's still open:

- Vercel: `virtality-platform-console` and `virtality-platform-adminboard` are synced through Doppler's Vercel integration. `virtality-platform-website`'s `stg`/preview config is not synced. The current Vercel plan has no preview environment sync target, so `apps/website` preview deploys still read env vars from Vercel's own dashboard, not Doppler. Revisit once the plan supports it.
- VPS (`services/server`, `services/socket`): both still run on the legacy `.env` files deployed to the VPS, not `doppler run` or a Doppler-injected runtime. Doppler holds the source of truth for `dev` locally, but the deployed VPS process env hasn't moved over yet. Treat the VPS `.env` as the live value until that migration happens.
- GitHub Actions: no Doppler-to-CI sync yet. CI secrets are plain `secrets.<NAME>` (see `[docs/research/ci-secrets-doppler-provisioning-e2e.md](../research/ci-secrets-doppler-provisioning-e2e.md)`).

When wiring any of the above, use service tokens scoped to one project and one config. Don't use personal `doppler login` tokens in CI or on servers.

---

## 1. Project structure and access (admin)

### 1.1 Naming convention (organize by repo)

Prefix every project with the **git repo** (or product) name, then the unit:

```text
<repo>-<unit>
```

For **this** monorepo (`virtality-platform`):

| Doppler project                 | Maps to local path | Notes                                            |
| ------------------------------- | ------------------ | ------------------------------------------------ |
| `virtality-platform-db`         | `packages/db`      | Prisma / migrate / seed                          |
| `virtality-platform-console`    | `apps/console`     | Clinician app                                    |
| `virtality-platform-adminboard` | `apps/adminboard`  | Internal admin                                   |
| `virtality-platform-website`    | `apps/website`     | Marketing site                                   |
| `virtality-platform-server`     | `services/server`  | API + Better Auth                                |
| `virtality-platform-socket`     | `services/socket`  | Realtime bridge                                  |
| `virtality-platform-shared`     | (references only)  | Cross-cutting secrets (optional but recommended) |

Other repos later: `virtality-<other-repo>-…` so the dashboard groups by repo.

### 1.2 Access model

| Role                       | Access                                                          |
| -------------------------- | --------------------------------------------------------------- |
| All engineers              | Collaborator (or Viewer) on `dev` for all platform projects     |
| Engineers who ship staging | `stg` as needed                                                 |
| Admins / on-call only      | `prd`                                                           |
| Shared project             | Admin-only write; apps **reference** secrets into their configs |

Use workplace **User Groups** when the team grows so you do not grant project-by-project forever.

### 1.3 Shared secrets pattern

Put values used in more than one app into `virtality-platform-shared` (same key names across `dev` / `stg` / `prd`), then in each app config use a [secret reference](https://docs.doppler.com/docs/secrets#referencing-across-projects), for example:

```text
# In virtality-platform-server / virtality-platform-website (dev)
REVALIDATE_SECRET=${virtality-platform-shared.dev.REVALIDATE_SECRET}
DATABASE_URL=${virtality-platform-shared.dev.DATABASE_URL}
```

Good candidates for `shared`:

- `DATABASE_URL` (local Compose URL on `dev`; real URLs on `stg` / `prd`)
- `REVALIDATE_SECRET` (website + server)
- Stripe / Google OAuth / SMTP / Cloudflare TURN / PostHog (when several apps need the same value)

App-specific keys stay only in that app’s project.

---

## 2. Flow: new machine (same person, new laptop)

You already have a Doppler user. Goal: CLI + login + scoped setup + local `.env` files.

1. Follow [Machine setup](./machine-setup.md) (Git, Node 24+, pnpm, Docker).
2. Install the Doppler CLI for your OS: see the [Doppler CLI docs](https://docs.doppler.com/docs/cli).
3. Authenticate:

   ```sh
   doppler login
   doppler me
   ```

4. Clone and install:

   ```sh
   git clone <repo-url> virtality-platform
   cd virtality-platform
   pnpm install
   ```

5. Bind directories to projects, using the `doppler.yaml` committed at the repo root:

   ```sh
   doppler setup --no-interactive
   ```

6. Materialize `.env` files:

   ```sh
   for dir in packages/db apps/console apps/adminboard apps/website services/server services/socket; do
     (cd "$dir" && doppler secrets download --no-file --format env > .env)
   done
   ```

7. Continue onboarding: `pnpm db:up`, `pnpm db:migrate:dev`, `pnpm dev:apps` ([Onboarding](./README.md)).
8. Optional: enable a personal config under `dev` for machine-specific overrides (`doppler configs create` / dashboard personal configs) so you do not edit shared `dev` for local-only tweaks.

**Do not** copy `.env` from the old laptop over USB as the long-term source of truth. Prefer a fresh download from Doppler.

---

## 3. Flow: new developer

Admin steps, then developer steps.

### 3.1 Admin (before day one)

1. Invite the person to the **Virtality** workplace (email invite from Doppler dashboard).
2. Grant access:

- All `virtality-platform-*` projects (except maybe restrict `shared` to Viewer if you use Restricted secrets carefully).
- Environment: `dev` **only** until they need staging/prod.

3. Point them at this doc + [Machine setup](./machine-setup.md) + [Onboarding](./README.md).
4. Do **not** paste production secrets into Slack/email. They pull via CLI after invite acceptance.

### 3.2 New developer checklist

1. Accept the Doppler invite; set up MFA if the workplace requires it.
2. Complete [Machine setup](./machine-setup.md).
3. Install CLI + login:

```sh
 brew install gnupg && brew install dopplerhq/cli/doppler   # macOS
 doppler login
```

4. Clone, `pnpm install`, `doppler setup --no-interactive`.
5. Download `.env` files (same loop as [§2](#2-flow-new-machine-same-person-new-laptop)).
6. Run DB + apps per [Onboarding](./README.md).
7. Confirm they can start apps **without** anyone sending secret values out of band.
8. If something is missing in `dev`, ask an admin to add it in Doppler (then re-download). Do not invent parallel private `.env` sets for shared team secrets.

### 3.3 Offboarding

1. Remove the user from the Doppler workplace (revokes CLI access).
2. Rotate any secrets they could have copied locally if policy requires it (especially `prd`).
3. Revoke any personal service tokens they created.

---

## Cheat sheet

```sh
doppler login
doppler setup --no-interactive
doppler secrets                          # list
doppler secrets set KEY=value            # set one
doppler secrets upload .env              # import file
doppler secrets download --no-file --format env > .env
doppler run -- pnpm dev                  # inject without writing .env
doppler open                             # dashboard for current scope
```

---

## Follow-ups (not required for local `dev`)

- Add a small `pnpm secrets:pull` script that runs the download loop.
- Sync `virtality-platform-website`'s `stg`/preview config to Vercel once the plan supports a preview sync target (console and adminboard are already synced, see the sync status above).
- Migrate `services/server` and `services/socket` on the VPS off the legacy `.env` files onto Doppler (service token + `doppler run`, or a deploy-time secrets pull).
- Sync `stg`/`prd` to GitHub Actions via Doppler integrations + service tokens.
- Update [Onboarding § Env files](./README.md) to prefer Doppler over “ask a teammate for values.”
- Refresh each `.env.example` to list every key actually in use, since real local `.env` files carry more keys than their `.example` counterparts.
