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

---

## 1. Account and workplace setup (once, admin)

Do this before inviting anyone or migrating secrets.

### 1.1 Create the workplace

1. Sign up / log in at [dashboard.doppler.com](https://dashboard.doppler.com).
2. Create a workplace named **Virtality** (or join the existing one).
3. Pick a plan that fits headcount ([pricing](https://www.doppler.com/pricing)): Developer is fine to start; Team when you need env-level RBAC / SSO.
4. Under workplace settings, set **default project environments** to `dev`, `stg`, `prd` (slugs matter for CLI flags).

### 1.2 Naming convention (organize by repo)

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

### 1.3 Create projects

In the dashboard (or CLI after login):

```sh
doppler projects create virtality-platform-db
doppler projects create virtality-platform-console
doppler projects create virtality-platform-adminboard
doppler projects create virtality-platform-website
doppler projects create virtality-platform-server
doppler projects create virtality-platform-socket
doppler projects create virtality-platform-shared
```

Confirm each has configs `dev`, `stg`, `prd`.

### 1.4 Access model

| Role                       | Access                                                          |
| -------------------------- | --------------------------------------------------------------- |
| All engineers              | Collaborator (or Viewer) on `dev` for all platform projects     |
| Engineers who ship staging | `stg` as needed                                                 |
| Admins / on-call only      | `prd`                                                           |
| Shared project             | Admin-only write; apps **reference** secrets into their configs |

Use workplace **User Groups** when the team grows so you do not grant project-by-project forever.

### 1.5 Shared secrets pattern

Put values used in more than one app into `virtality-platform-shared` (same key names across `dev` / `stg` / `prd`), then in each app config use a [secret reference](https://docs.doppler.com/docs/secrets#referencing-across-projects), for example:

```text
# In virtality-platform-server / virtality-platform-website (dev)
REVALIDATE_SECRET=${virtality-platform-shared.dev.REVALIDATE_SECRET}
CONSOLE_DATABASE_URL=${virtality-platform-shared.dev.CONSOLE_DATABASE_URL}
```

Good candidates for `shared`:

- `CONSOLE_DATABASE_URL` (local Compose URL on `dev`; real URLs on `stg` / `prd`)
- `REVALIDATE_SECRET` (website + server)
- Stripe / Google OAuth / SMTP / Cloudflare TURN / PostHog (when several apps need the same value)

App-specific keys stay only in that app’s project.

---

## 2. Move existing secrets into Doppler

Do this from a machine that already has working local `.env` files (or vault exports). Prefer importing from files over retyping.

### 2.1 Inventory (source of truth today)

| Path              | Example file                         | Typical secrets                                                                  |
| ----------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `packages/db`     | `.env.example`                       | `CONSOLE_DATABASE_URL`                                                           |
| `apps/console`    | `.env.example`                       | DB, PostHog, AWS, Discord                                                        |
| `apps/adminboard` | `.env.example`                       | DB                                                                               |
| `apps/website`    | `.env.example`                       | `REVALIDATE_SECRET`, PostHog                                                     |
| `services/server` | `.env.example`                       | Auth, DB, Stripe, Google, SMTP, TURN, waitlist                                   |
| `services/socket` | `.env.example`                       | `ENV`, `PORT`, optional `SIM`                                                    |
| `.sandcastle`     | `.env.example` (optional / personal) | `CURSOR_API_KEY`, `GH_TOKEN`, `GH_REPO` (keep personal tokens out of team `dev`) |

Also migrate any filled local `.env` values that are **not** in the examples (SMTP, Stripe test keys, Google OAuth, real PostHog tokens).

### 2.2 Admin CLI (one machine)

```sh
# macOS
brew install gnupg
brew install dopplerhq/cli/doppler

doppler login
doppler me
```

### 2.3 Import each `.env` into the matching project `dev` config

From the monorepo root, with real secrets in each local `.env` (never commit them):

```sh
# Shared first (edit/create a temp file with only cross-cutting keys, or import once then reference)
doppler secrets upload packages/db/.env \
  --project virtality-platform-shared --config dev

# Or set shared keys explicitly:
# doppler secrets set CONSOLE_DATABASE_URL="postgresql://..." REVALIDATE_SECRET="..." \
#   -p virtality-platform-shared -c dev

doppler secrets upload packages/db/.env \
  --project virtality-platform-db --config dev

doppler secrets upload apps/console/.env \
  --project virtality-platform-console --config dev

doppler secrets upload apps/adminboard/.env \
  --project virtality-platform-adminboard --config dev

doppler secrets upload apps/website/.env \
  --project virtality-platform-website --config dev

doppler secrets upload services/server/.env \
  --project virtality-platform-server --config dev

doppler secrets upload services/socket/.env \
  --project virtality-platform-socket --config dev
```

`doppler secrets upload` reads a classic `.env` file. Strip comments-only lines if the CLI complains.

### 2.4 Fill `stg` and `prd`

1. In the dashboard, open each project → `stg` / `prd`.
2. Copy structure from `dev`, then replace values with staging/production credentials.
3. Prefer promoting only the keys that differ; keep local Compose URLs out of `stg` / `prd`.
4. Wire hosting later (Vercel / Docker / GitHub Actions) with **service tokens** scoped to one project + one config. Do not use personal `doppler login` tokens in CI.

### 2.5 Commit a monorepo `doppler.yaml` (no secrets)

At the repo root (committed):

```yaml
# doppler.yaml — project/config pointers only; no secret values
setup:
  - project: virtality-platform-db
    config: dev
    path: packages/db/
  - project: virtality-platform-console
    config: dev
    path: apps/console/
  - project: virtality-platform-adminboard
    config: dev
    path: apps/adminboard/
  - project: virtality-platform-website
    config: dev
    path: apps/website/
  - project: virtality-platform-server
    config: dev
    path: services/server/
  - project: virtality-platform-socket
    config: dev
    path: services/socket/
```

Developers then run:

```sh
doppler setup --no-interactive
```

That writes scopes under `~/.doppler/` (local only), keyed by absolute directory path.

### 2.6 Local workflow: download vs `doppler run`

This monorepo uses Turbo and per-package `.env` files. Prefer **download into gitignored `.env`** for day-to-day `pnpm` / Turbo:

```sh
# After doppler setup, from each package directory:
doppler secrets download --no-file --format env > .env
```

Or a one-shot from root (adjust if you add a script later):

```sh
for dir in packages/db apps/console apps/adminboard apps/website services/server services/socket; do
  (cd "$dir" && doppler secrets download --no-file --format env > .env)
done
```

Use `doppler run -- <cmd>` when you want a single process without writing a file:

```sh
cd services/server && doppler run -- pnpm dev
```

Refresh after someone changes Doppler `dev`:

```sh
doppler secrets download --no-file --format env > .env
```

### 2.7 Verify

```sh
cd services/server
doppler secrets          # list names (values masked as configured)
doppler run -- printenv BETTER_AUTH_SECRET | head -c 8; echo
pnpm db:up && pnpm db:migrate:dev
pnpm dev:apps            # or your usual turbo target
```

When everything boots, treat Doppler as source of truth. Rotate any secret that was previously shared over chat/email.

---

## 3. Flow: new machine (same person, new laptop)

You already have a Doppler user. Goal: CLI + login + scoped setup + local `.env` files.

1. Follow [Machine setup](./machine-setup.md) (Git, Node 24+, pnpm, Docker).
2. Install Doppler CLI (macOS example):

   ```sh
   brew install gnupg
   brew install dopplerhq/cli/doppler
   doppler --version
   ```

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

5. Bind directories to projects (uses committed `doppler.yaml`):

   ```sh
   doppler setup --no-interactive
   ```

   If `doppler.yaml` is not in the repo yet, run `doppler setup` interactively once per path listed in the table above (`dev` config).

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

## 4. Flow: new developer

Admin steps, then developer steps.

### 4.1 Admin (before day one)

1. Invite the person to the **Virtality** workplace (email invite from Doppler dashboard).
2. Grant access:
   - All `virtality-platform-*` projects (except maybe restrict `shared` to Viewer if you use Restricted secrets carefully).
   - Environment: **`dev` only** until they need staging/prod.
3. Point them at this doc + [Machine setup](./machine-setup.md) + [Onboarding](./README.md).
4. Do **not** paste production secrets into Slack/email. They pull via CLI after invite acceptance.

### 4.2 New developer checklist

1. Accept the Doppler invite; set up MFA if the workplace requires it.
2. Complete [Machine setup](./machine-setup.md).
3. Install CLI + login:

   ```sh
   brew install gnupg && brew install dopplerhq/cli/doppler   # macOS
   doppler login
   ```

4. Clone, `pnpm install`, `doppler setup --no-interactive`.
5. Download `.env` files (same loop as [§3](#3-flow-new-machine-same-person-new-laptop)).
6. Run DB + apps per [Onboarding](./README.md).
7. Confirm they can start apps **without** anyone sending secret values out of band.
8. If something is missing in `dev`, ask an admin to add it in Doppler (then re-download). Do not invent parallel private `.env` sets for shared team secrets.

### 4.3 Offboarding

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

- Commit root `doppler.yaml` once projects exist.
- Add a small `pnpm secrets:pull` script that runs the download loop.
- Sync `stg` / `prd` to Vercel / GitHub Actions via Doppler integrations + service tokens.
- Update [Onboarding § Env files](./README.md) to prefer Doppler over “ask a teammate for values.”
