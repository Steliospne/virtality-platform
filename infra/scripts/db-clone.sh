#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT="$( cd "$DIR/../.." >/dev/null 2>&1 && pwd )"
ENV_FILE="$PROJECT_ROOT/packages/db/.env"
SKIP_MIGRATIONS=false
SOURCE="prod"

PG_CLIENT_INSTALL_HINT=$'Install PostgreSQL client tools (pg_dump, psql, pg_restore):\n  Arch:    sudo pacman -S postgresql\n  Debian:  sudo apt install postgresql-client\n  Fedora:  sudo dnf install postgresql\n  macOS:   brew install libpq\n           echo '"'"'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"'"'"' >> ~/.zshrc'

PNPM_INSTALL_HINT=$'Install pnpm (repo expects 11.9.0 via Corepack):\n  corepack enable\n  corepack prepare pnpm@11.9.0 --activate\n\nOr: npm install -g pnpm'

require_command() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' is not installed or not on PATH." >&2
    echo "" >&2
    echo -e "$hint" >&2
    exit 1
  fi
}

check_dependencies() {
  local missing_pg=()
  for cmd in pg_dump psql pg_restore; do
    if ! command -v "$cmd" &>/dev/null; then
      missing_pg+=("$cmd")
    fi
  done

  if [ ${#missing_pg[@]} -gt 0 ]; then
    echo "Error: missing PostgreSQL client tools: ${missing_pg[*]}" >&2
    echo "" >&2
    echo -e "$PG_CLIENT_INSTALL_HINT" >&2
    exit 1
  fi

  if [ "$SKIP_MIGRATIONS" != true ]; then
    require_command pnpm "$PNPM_INSTALL_HINT"
  fi
}

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Clone a remote database into the local console database.

Options:
  --prod             Dump from DATABASE_URL_PROD (default)
  --dev              Dump from DATABASE_URL_DEV
  --skip-migrations  Restore as-is; do not apply pending local migrations
  -h, --help         Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      SOURCE="prod"
      shift
      ;;
    --dev)
      SOURCE="dev"
      shift
      ;;
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

check_dependencies

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

export $(grep -v '^#' "$ENV_FILE" | xargs)

if [ "$SOURCE" = "prod" ]; then
  REMOTE_DATABASE_URL="$DATABASE_URL_PROD"
  SOURCE_LABEL="production"
else
  REMOTE_DATABASE_URL="$DATABASE_URL_DEV"
  SOURCE_LABEL="dev"
fi

if [ -z "$REMOTE_DATABASE_URL" ]; then
  echo "Error: DATABASE_URL_${SOURCE^^} is not set in $ENV_FILE" >&2
  exit 1
fi

DUMP_FILE="${SOURCE}.dump"

# Dump remote DB
echo ">>> Dumping ${SOURCE_LABEL} database..."
pg_dump "$REMOTE_DATABASE_URL" -Fc -f "$DUMP_FILE"

# Wipe local schema (--clean on pg_restore drops objects without CASCADE and fails on FK deps)
echo ">>> Resetting local database schema..."
psql "$CONSOLE_DATABASE_URL" -v ON_ERROR_STOP=1 <<-SQL
	DROP SCHEMA IF EXISTS public CASCADE;
	CREATE SCHEMA public;
	GRANT ALL ON SCHEMA public TO public;
SQL

# Restore into local DB
echo ">>> Restoring into local database..."
pg_restore --dbname="$CONSOLE_DATABASE_URL" --no-owner --no-privileges "$DUMP_FILE"

if [ "$SKIP_MIGRATIONS" = true ]; then
  echo ">>> Skipping pending local migrations (--skip-migrations)."
else
  # Remote DB may be behind local migration history: re-apply pending migrations from this branch
  echo ">>> Applying pending local migrations..."
  (cd "$PROJECT_ROOT/packages/db" && pnpm migrate:deploy)
fi

echo ">>> Cleaning up dump..."
rm "$DUMP_FILE"

if [ "$SKIP_MIGRATIONS" = true ]; then
  echo ">>> Done! Local DB is a ${SOURCE_LABEL} clone (migrations not applied)."
else
  echo ">>> Done! Local DB is a ${SOURCE_LABEL} clone with pending migrations applied."
fi
