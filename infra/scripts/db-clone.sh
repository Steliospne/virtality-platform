#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PROJECT_ROOT="$( cd "$DIR/../.." >/dev/null 2>&1 && pwd )"
ENV_FILE="$PROJECT_ROOT/packages/db/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

export $(grep -v '^#' "$ENV_FILE" | xargs)

# Dump production DB
echo ">>> Dumping production database..."
pg_dump "$DATABASE_URL" -Fc -f prod.dump

# Wipe local schema (--clean on pg_restore drops objects without CASCADE and fails on FK deps)
echo ">>> Resetting local database schema..."
psql "$CONSOLE_DATABASE_URL" -v ON_ERROR_STOP=1 <<-SQL
	DROP SCHEMA IF EXISTS public CASCADE;
	CREATE SCHEMA public;
	GRANT ALL ON SCHEMA public TO public;
SQL

# Restore into local DB
echo ">>> Restoring into local database..."
pg_restore --dbname="$CONSOLE_DATABASE_URL" --no-owner --no-privileges prod.dump

# Prod is behind local migration history — re-apply pending migrations from this branch
echo ">>> Applying pending local migrations..."
(cd "$PROJECT_ROOT/packages/db" && pnpm migrate:deploy)

echo ">>> Cleaning up dump..."
rm prod.dump

echo ">>> Done! Local DB is a production clone with pending migrations applied."
