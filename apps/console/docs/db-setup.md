# Development Database Setup

This document outlines the steps to set up the PostgreSQL database for local development.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

- Docker and Docker Compose
- Node.js and npm

## 2. Setting up the Local PostgreSQL Database with Docker Compose

The project uses `compose.yml` to define a local PostgreSQL service.

**Steps:**

1.  **Navigate to the project root**

2.  **Start the PostgreSQL container:**
    ```bash
    docker compose up -d postgres
    ```
    This command will download the PostgreSQL image (if not present), create a container named `local_postgres`, and expose it on port `5432`. Data will be persisted using a Docker volume.

## 3. Cloning the Production Database (Optional)

To work with a copy of the production database locally, use the `db_clone.sh` script.

**Steps:**

1.  **Create an `.env` file:** In the project root, create an `.env` file with the following variables:
    - `DATABASE_URL_REMOTE`: The connection string for the production database.
    - `DATABASE_URL`: The connection string for your local development database (e.g., `postgresql://devuser:devpass@localhost:5432/devdb`).

2.  **Ensure script executability (Linux/WSL):**

    ```bash
    chmod +x scripts/db_clone.sh
    ```

3.  **Run the cloning script:**
    - **Linux/WSL:** `./scripts/db_clone.sh`
    - **Windows (Git Bash/WSL):** `./scripts/db_clone.sh` (Note: direct execution in PowerShell/CMD might require `bash scripts/db_clone.sh` if bash is not in PATH)

    This script will dump the production database and restore it into your local PostgreSQL instance.

## 4. Updating the Prisma Client

If there are any schema changes, you'll need to update the Prisma client.

**Steps:**

1.  **Navigate to the project root** (if not already there).

2.  **Run the update script:**
    ```bash
    npm run update:prisma
    ```
    This script will refresh your Prisma client with the latest schema.
