# Research: Local/dev secret sharing for a small monorepo team

**Date:** 2026-08  
**Question:** For Virtality’s pnpm monorepo (multiple `.env` files across Next apps + Node services), which of five vault-style tools fit a ~2–10 person team for **safe local/dev secret sharing**, with a clear path to GitHub Actions / Vercel / Docker later?  
**Audience:** Experienced fullstack; choosing what onboarding docs should recommend.  
**Scope:** Exactly these five: 1Password (Environments / Secrets Automation / `op run`), Doppler, Infisical, Bitwarden Secrets Manager, HashiCorp Vault (clarify product).  
**Sources:** Vendor pricing and primary docs (cited inline). Prices are list/USD as published ~2026-08; confirm on vendor pages before buying.

---

## Comparison table (rough)

| Criterion               | 1Password                                                                               | Doppler                                                                | Infisical                                                  | Bitwarden SM                                       | HashiCorp (realistic pick)                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Price (~2–10 seats)** | Teams Starter **$24.95/mo** (≤10) or Business **~$9/user/mo**; Developer tools included | Free ≤3 users; then **$8/user/mo** (Developer) or Team **$21/user/mo** | Free ≤5 identities; Pro **~$20/identity/mo**               | Free ≤2 users; Teams **$6/user/mo**                | **Community self-host $0** (ops cost) or **HCP Vault Dedicated** (cluster hours; Dev tier sandbox). **HCP Vault Secrets is EOL** |
| **Lock-in**             | Proprietary SaaS; vault export/manual migrate                                           | Proprietary SaaS; strong `.env`/JSON/YAML export via CLI/API; CLI OSS  | **MIT core + self-host**; Cloud optional                   | OSS heritage; secrets export; Enterprise self-host | Community/OSS-ish (BUSL Vault); portable CLI/API; high ops                                                                       |
| **Local DX**            | `op run` + Environments / `op://` `.env` refs; app + CLI                                | `doppler run` + monorepo `doppler.yaml` paths                          | `infisical run` + `--path` folders; `infisical init`       | `bws run` (+ project id); machine-account tokens   | No first-class `* run` for app envs; agent/templates/scripts                                                                     |
| **CI / host / Docker**  | Service accounts, CI/CD docs, Connect                                                   | GitHub sync, Vercel/config syncs, Docker CLI image                     | GitHub Actions (OIDC), Vercel sync, Docker `infisical run` | GitHub Action `sm-action`, `bws run`, SDKs         | GHA/JWT auth, agents, K8s injector; heavier than env-inject SaaS                                                                 |

---

## 1. 1Password (Environments / Secrets Automation / `op run`)

### Price

- **Teams Starter Pack:** **$24.95/mo** billed annually, includes **up to 10 members**. **Business:** **$8.99/user/mo** billed annually. ([Business & Teams pricing](https://1password.com/pricing/business))
- **1Password Developer** (CLI, Environments, Secrets Automation via service accounts / Connect) is **included in plans**, including Teams/Business. ([Developer FAQ](https://1password.com/developer-security))
- Rough Virtality band: **~$25/mo** on Starter (≤10) if the team already wants a password manager; otherwise compare as PM + secrets vs secrets-only tools.

### Vendor lock-in

- Proprietary cloud; secrets live in 1Password vaults/Environments.
- Migrate-out is item/Environment export and re-import elsewhere (no dedicated “secrets platform” export product). Connect is self-hosted cache/API for automation. ([Secrets Automation](https://www.1password.dev/secrets-automation))

### DX for local dev

- **`op run`** injects env vars for a subprocess; **Environments (beta)** via `op run --environment <id>`, and/or **`.env` files with `op://…` secret references** via `--env-file`. ([Load secrets into the environment](https://developer.1password.com/docs/cli/secrets-environment-variables/))
- Multi-app monorepo: one Environment per app/context, or shared env files with references; Apple silicon note: prefer [locally mounted `.env`](https://developer.1password.com/docs/environments/local-env-file) for some Environment workflows.
- New laptop: install desktop app + CLI, unlock, share vault/Environment access.

### Compatibility

- CI/prod: **service accounts** (scoped tokens) or **Connect**; documented CI/CD path. ([Service accounts / Connect](https://www.1password.dev/secrets-automation))
- Wrappers: same `op run` pattern as `doppler run`. Hosting (Vercel): typically sync/copy secrets into host env, or pull at build via service account (not a first-party “Vercel sync” product like Doppler/Infisical).

---

## 2. Doppler

### Price

- **Developer:** free for **3 users**, then **$8/mo per additional user** (caps/features on pricing page). **Team:** **$21/mo per user** (14-day trial). AI/non-human identities not billed as seats. ([Doppler Pricing](https://www.doppler.com/pricing))
- Rough band: **$0** (≤3), **~$56/mo** for 10 on Developer overage math, or **~$210/mo** on Team for 10.

### Vendor lock-in

- Managed SaaS (on-prem is Enterprise). **CLI is open source**; secrets export via dashboard/CLI/API (`.env`, YAML, JSON). ([CLI Guide](https://docs.doppler.com/docs/cli), [platform](https://www.doppler.com/platform/secrets-manager))
- Migrate-out is straightforward export; no self-host of the control plane on lower tiers.

### DX for local dev

- **`doppler login` → `doppler setup` → `doppler run -- <cmd>`**; directory-scoped project/config.
- **Monorepo:** `doppler.yaml` can map subdirs to different projects/configs (`path: backend/`, etc.). ([CLI Guide](https://docs.doppler.com/docs/cli))
- New laptop: install CLI, login, `doppler setup` (or commit `doppler.yaml` + non-interactive setup).

### Compatibility

- **GitHub:** official integration syncs configs → Actions/Codespaces/etc. secrets. ([GitHub Actions](https://docs.doppler.com/docs/github-actions))
- **Docker / any process:** CLI in image or host; `doppler run`. Config syncs toward hosts (including common PaaS targets; Vercel via sync integrations on plan limits). Strong “source of truth → sync” story.

---

## 3. Infisical

### Price

- **Free:** **$0**, **5 identities**, unlimited projects (plan feature matrix on site). **Pro:** **$20/identity/mo** (annual billing discount shown). Higher tiers Advanced/Enterprise. ([Infisical Pricing](https://infisical.com/pricing))
- “Identity” = human or machine that uses the platform (see pricing FAQ on that page). Rough band: free for a tiny team; Pro can climb if every CI machine identity counts.

### Vendor lock-in

- **Open-source core (MIT)** with self-host; Cloud is optional. `ee/` is licensed/premium. ([GitHub Infisical/infisical](https://github.com/infisical/infisical))
- Best migrate-out / avoid-SaaS story among the five if self-hosting is acceptable.

### DX for local dev

- **`infisical login` → `infisical init` → `infisical run -- <cmd>`**.
- Monorepo: **`--path=/apps/…`** (and `--env=`) to select foldered secrets. ([CLI usage](https://infisical.com/docs/cli/usage))
- New laptop: CLI + login + existing committed `.infisical.json` (non-secret project pointer).

### Compatibility

- **GitHub Actions:** official action + **OIDC machine identities** (no long-lived token required). ([GitHub Actions](https://infisical.com/docs/integrations/cicd/githubactions))
- **Vercel:** Secret Sync pushes envs. ([Vercel sync](https://infisical.com/docs/integrations/secret-syncs/vercel), [Next.js + Vercel guide](https://infisical.com/docs/documentation/guides/nextjs-vercel))
- **Docker:** document `infisical run` as container CMD with token/identity. ([CLI usage](https://infisical.com/docs/cli/usage))

---

## 4. Bitwarden Secrets Manager

### Price

- **Free:** unlimited secrets, **≤2 users**, **≤3 projects**, **≤3 machine accounts**. **Teams:** **$6/user/mo** (annual). **Enterprise:** **$12/user/mo** (SSO/SCIM/self-host). Extra machine accounts billed. ([Product pricing](https://bitwarden.com/products/secrets-manager/), [Plans](https://bitwarden.com/help/secrets-manager-plans/))
- Rough band for 2–10: free only fits a pair; **~$12–$60/mo** on Teams for 2–10 seats.

### Vendor lock-in

- Built on Bitwarden’s OSS/E2E model; **secrets export** on Free/Teams/Enterprise. Enterprise self-host. Separate product from Password Manager (can use both). ([Plans](https://bitwarden.com/help/secrets-manager-plans/))

### DX for local dev

- CLI **`bws run -- 'npm run start'`** injects secrets as env vars; optional `--project-id`. Auth via **machine account access token** (not the same UX as human `doppler login`). ([Secrets Manager CLI](https://bitwarden.com/help/secrets-manager-cli/))
- Multi-project monorepo: organize by **projects**; run with project scoping. Onboarding is token + CLI install more than “share a vault invite.”

### Compatibility

- **GitHub Actions:** `bitwarden/sm-action` injects masked envs from secret IDs. ([GitHub Actions](https://bitwarden.com/help/github-actions-integration/))
- Docker/scripts: wrap with `bws run`. Vercel: no first-class sync called out like Doppler/Infisical; push via CI or host env APIs.

---

## 5. HashiCorp Vault (and why not HCP Vault Secrets)

### Which product?

- **HCP Vault Secrets** (the lightweight, env-oriented SaaS) is **decommissioned**: end of sale **2025-06-30**; end of life **earlier of Flex expiry or 2026-07-01**. Alternatives named: **HCP Vault Dedicated** or **Vault Community**. ([HCP Vault Secrets EOL](https://support.hashicorp.com/hc/en-us/articles/41802449287955-HCP-Vault-Secrets-End-Of-Life))
- For a **small team sharing local/dev `.env`s in 2026-08**, the realistic HashiCorp options are:
  1. **Vault Community Edition** (self-host, free license, you operate it), or
  2. **HCP Vault Dedicated** (managed Vault Enterprise): **Development** tier for sandbox/non-prod (single-node, **25 client** limit, no SLA); **Essentials/Standard** for production HA + per-client charges on PAYG. ([Tiers and features](https://developer.hashicorp.com/hcp/docs/vault/get-started/deployment-considerations/tiers-and-features))
- Dollar amounts for Dedicated are **portal/region hourly** (not a flat “$X/seat” secrets tool). Expect **ops or cloud bill**, not a Doppler-like per-seat SKU.

### Price / lock-in / DX / connectivity (brief)

- **Price:** Community **$0** + infra/time; Dedicated **hourly cluster** (+ clients on Essentials/Standard). Poor fit if the only goal is shared local `.env`s.
- **Lock-in:** Portable KV/API/CLI; self-host possible; Enterprise/BUSL nuances for full Vault. High **operational** lock-in (policies, unseal, upgrades).
- **Local DX:** Powerful (KV, policies, optional dynamic secrets) but **not** a polished `doppler run` / Environments workflow out of the box; teams usually write scripts, templates, or agents.
- **Compatibility:** Excellent for GHA (JWT), K8s, cloud IAM; overkill for “inject Next `dev` envs on a laptop.”

---

## Decision factors for Virtality

Tradeoffs for onboarding docs (no forced pick):

1. **Already on 1Password?** Environments + `op run` / `op://` env files minimize new vendors; CI needs service accounts; Vercel sync is weaker than Doppler/Infisical.
2. **Best monorepo local DX / later sync?** Doppler’s `doppler.yaml` paths + `doppler run` + GitHub/config syncs are purpose-built; watch Team pricing if you need RBAC/SSO.
3. **Want OSS / self-host / lower SaaS lock-in?** Infisical matches `* run` DX and path-based monorepos; watch **identity** billing and Free’s 5-identity cap.
4. **Cost-sensitive paid seats + export?** Bitwarden SM Teams is cheap per user; free tier is **2 users** only; DX centers on **machine tokens** + `bws run`.
5. **Avoid HashiCorp for this use case unless** you already need Vault for infra/dynamic secrets: **HCP Vault Secrets is gone**; Community/Dedicated are the wrong shape/cost for “share `.env` across a pnpm monorepo.”

**Practical onboarding lens:** prefer tools with **`… run` wrappers**, **multi-project or path mapping**, and a documented **GHA + Vercel** path so local patterns do not fork from staging/prod later.
