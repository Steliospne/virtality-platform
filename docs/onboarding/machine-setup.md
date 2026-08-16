# Machine setup

Install the host tools needed before [`README.md`](./README.md) (clone, env, migrate, `pnpm dev:apps`).

You need:

| Tool    | Version / notes                                     |
| ------- | --------------------------------------------------- |
| Git     | Any recent 2.x                                      |
| Node.js | **>= 24** (`devEngines` in root `package.json`)     |
| pnpm    | **11.9.0** (root `packageManager`; prefer Corepack) |
| Docker  | Engine + Compose v2 (`pnpm db:up` uses Compose)     |

Optional but useful: a Node version manager ([fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm)), and the [GitHub CLI](https://cli.github.com/) (`gh`) for issues/PRs.

After this page, continue at [Onboarding](./README.md).

---

## Shared checks (all platforms)

Run these in the shell you will use for the repo (on Windows, that means **inside WSL**):

```sh
git --version
node -v          # v24.x or newer
corepack --version
pnpm -v          # 11.9.x after Corepack prepare
docker --version
docker compose version
```

Enable pnpm from the repo’s pinned version (from the clone, or after you have Node 24+):

```sh
corepack enable
corepack prepare pnpm@11.9.0 --activate
```

If `corepack` is missing, you are likely on Node **25+** (Corepack is no longer bundled) or a minimal install. Prefer Node **24 LTS-style** for this monorepo, or install pnpm via the [official standalone installer](https://pnpm.io/installation) and still match `11.9.0`.

---

## 1. Linux

### Git

```sh
# Debian / Ubuntu
sudo apt update && sudo apt install -y git

# Fedora
sudo dnf install -y git

# Arch
sudo pacman -S git
```

### Node.js 24+

**Recommended:** [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm), then install Node 24:

```sh
# Example with fnm (after installing fnm for your distro)
fnm install 24
fnm use 24
fnm default 24
```

```sh
# Example with nvm
nvm install 24
nvm use 24
nvm alias default 24
```

Avoid distro packages that pin an older Node (18/20) unless you know they ship 24+.

### pnpm

```sh
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm -v
```

### Docker Engine + Compose

Follow Docker’s current docs for your distro: [Install Docker Engine](https://docs.docker.com/engine/install/).

Typical Debian/Ubuntu shape (confirm package names on docker.com before copy-pasting into production hosts):

```sh
# After adding Docker’s apt repository per official docs:
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
# Log out and back in (or newgrp docker), then:
docker run --rm hello-world
docker compose version
```

Do **not** rely on the obsolete `docker-compose` (hyphen) v1 binary; this repo expects `docker compose`.

### Clone and continue

```sh
git clone <repo-url> virtality-platform
cd virtality-platform
```

Then open [Onboarding](./README.md).

---

## 2. macOS

### Xcode CLT + Git

```sh
xcode-select --install   # if prompted; provides git
git --version
```

### Homebrew (recommended)

```sh
# https://brew.sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the brew “Next steps” to put `brew` on your `PATH` (Apple Silicon vs Intel differ).

### Node.js 24+

```sh
brew install fnm
# Add fnm to your shell per `fnm env` instructions, then:
fnm install 24
fnm use 24
fnm default 24
node -v
```

Alternatively: `brew install node@24` and link it, or use nvm.

### pnpm

```sh
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm -v
```

### Docker Desktop

1. Install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/).
2. Start Docker Desktop and wait until it shows running.
3. Confirm:

```sh
docker --version
docker compose version
docker run --rm hello-world
```

On Apple Silicon, use the Apple Silicon build of Docker Desktop.

### Clone and continue

```sh
git clone <repo-url> virtality-platform
cd virtality-platform
```

Then open [Onboarding](./README.md).

---

## 3. Windows (WSL)

Native Windows PowerShell/CMD is **not** supported for day-to-day work on this monorepo. Use **WSL2** with an Ubuntu (or similar) distro and keep the repo on the Linux filesystem (for example `~/Projects/...`), not under `/mnt/c/...`, for acceptable `pnpm` / file-watch performance.

### Enable WSL2 + Ubuntu

In **Windows** (PowerShell as Administrator):

```powershell
wsl --install
# Or, if WSL exists already:
wsl --install -d Ubuntu
wsl --set-default-version 2
```

Reboot if Windows asks. Open **Ubuntu** from the Start menu and finish the Linux user setup.

Docs: [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install).

### Inside WSL: Git, Node, pnpm

```sh
sudo apt update && sudo apt install -y git curl build-essential
```

Install Node 24 with fnm or nvm (same as Linux section), then:

```sh
corepack enable
corepack prepare pnpm@11.9.0 --activate
node -v
pnpm -v
```

### Docker on Windows + WSL

**Preferred:** [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) with the **WSL2** backend and your Ubuntu distro enabled under _Settings → Resources → WSL integration_.

Then, **inside WSL**:

```sh
docker --version
docker compose version
docker run --rm hello-world
```

If `docker` is missing inside WSL, turn on WSL integration for that distro in Docker Desktop and open a **new** WSL terminal.

Alternative (advanced): Docker Engine installed only inside WSL (Linux instructions). Desktop + integration is usually less friction for newdevs.

### Git line endings (optional)

If you also edit from Windows tools, set:

```sh
git config --global core.autocrlf input
```

Prefer editing inside WSL (VS Code/Cursor “Remote - WSL” or opening the Linux folder).

### Clone and continue (inside WSL)

```sh
cd ~
mkdir -p Projects && cd Projects
git clone <repo-url> virtality-platform
cd virtality-platform
```

Then open [Onboarding](./README.md).

---

## Troubleshooting

| Symptom                             | Likely fix                                                     |
| ----------------------------------- | -------------------------------------------------------------- |
| `pnpm: command not found`           | `corepack enable` + `corepack prepare pnpm@11.9.0 --activate`  |
| Wrong pnpm major                    | Re-run `corepack prepare pnpm@11.9.0 --activate` from the repo |
| `node` is v18/v20                   | Switch default with fnm/nvm to 24+                             |
| `docker: permission denied` (Linux) | User in `docker` group; re-login                               |
| `docker` missing in WSL             | Enable Docker Desktop WSL integration; new shell               |
| Slow installs on WSL                | Clone under `~`, not `/mnt/c`                                  |
| `pnpm db:up` fails                  | Docker daemon running; `docker compose version` works          |

When the shared checks pass, go to [Onboarding](./README.md) for env files, database, and `pnpm dev:apps`.
