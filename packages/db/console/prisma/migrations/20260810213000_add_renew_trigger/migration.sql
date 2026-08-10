-- CreateEnum
CREATE TYPE "RenewTriggerChannel" AS ENUM ('email', 'in_app');

-- CreateTable
CREATE TABLE "RenewTrigger" (
    "id" TEXT NOT NULL,
    "channel" "RenewTriggerChannel" NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "RenewTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenewTrigger_channel_idx" ON "RenewTrigger"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "RenewTrigger_channel_daysBefore_key" ON "RenewTrigger"("channel", "daysBefore");

-- Seed default 7 / 3 / 1 active rows for both channels.
INSERT INTO "RenewTrigger" ("id", "channel", "daysBefore", "active", "createdAt", "updatedAt")
VALUES
    ('renew-email-7', 'email', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('renew-email-3', 'email', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('renew-email-1', 'email', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('renew-in-app-7', 'in_app', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('renew-in-app-3', 'in_app', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('renew-in-app-1', 'in_app', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
