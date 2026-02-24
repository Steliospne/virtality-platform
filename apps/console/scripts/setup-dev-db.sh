#!/bin/bash

BRANCH_NAME=$(git branch --show-current)
PROJECT_ID="falling-meadow-14528048"
DATABASE_NAME="virtality_app_prod"

if ! command -v node &> /dev/null; then
    echo "🚫 Node.js is not installed. This script requires Node. Come back when you're serious. 👋"
    exit 1
fi

if ! command -v neon &> /dev/null; then
    echo "⚠️ 'neon' cli is not installed."
    read -p "👉 Do you want to install it globally via npm? [y/N]: " response
    case "$response" in
        [yY][eE][sS]|[yY])
            npm install -g neonctl
            echo "✅ 'neon' cli installed globally via npm."
            ;;
        *)
            echo "❌ Can't proceed without the Neon cli. Come back when you're ready. 👋"
            exit 1
            ;;
    esac
fi

if neon branches get --project-id "$PROJECT_ID" "$BRANCH_NAME" &> /dev/null; then
    echo "⚠️ Branch '$BRANCH_NAME' already exists on Neon — skipping creation."
else
    echo "✨ Creating Neon branch '$BRANCH_NAME'..."
    neon branches create --project-id "$PROJECT_ID" --name "$BRANCH_NAME" 
    echo "✅ Dev branch '$BRANCH_NAME' created"
fi


CONN_STRING=$(neon connection-string "$BRANCH_NAME" --project-id "$PROJECT_ID" --prisma true --database-name "$DATABASE_NAME")

ESCAPED_CONN_STRING=$(printf '%s\n' "$CONN_STRING" | sed 's/&/\\\&/g')

# Replace or add DATABASE_URL in .env
if grep -q '^\s*DATABASE_URL=' .env; then
    sed -i "s|^\s*DATABASE_URL=.*|DATABASE_URL=$ESCAPED_CONN_STRING|" .env
else
    echo "DATABASE_URL=$CONN_STRING" >> .env
fi

echo "✅ .env updated with new DATABASE_URL."
