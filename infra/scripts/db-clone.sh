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

# Restore into local DB
echo ">>> Restoring into local database..."
pg_restore --dbname $CONSOLE_DATABASE_URL --clean --no-owner --no-privileges prod.dump

echo ">>> Cleaning up dump..."
rm prod.dump

echo ">>> Done! Your local DB is now a clone of production."
