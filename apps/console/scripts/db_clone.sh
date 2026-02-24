#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export $(grep -v '^#' "$DIR/../.env" | xargs)

# Dump production DB
echo ">>> Dumping production database..."
pg_dump "$DATABASE_URL_REMOTE" -Fc -f prod.dump

# Restore into local DB
echo ">>> Restoring into local database..."
pg_restore --dbname $DATABASE_URL --clean --no-owner --no-privileges prod.dump

echo ">>> Cleaning up dump..."
rm prod.dump

echo ">>> Done! Your local DB is now a clone of production."
