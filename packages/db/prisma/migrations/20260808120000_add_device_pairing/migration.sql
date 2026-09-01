-- Pairing attempts are short-lived server-owned records. The raw six-digit code
-- is intentionally stored for the initial implementation; activeCode and
-- activeDeviceKey are nullable uniqueness guards released on terminal states.
CREATE TYPE "DevicePairingStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'SUPERSEDED', 'EXPIRED');

CREATE TABLE "DevicePairingAttempt" (
    "id" TEXT NOT NULL,
    "deviceRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "activeCode" TEXT,
    "activeDeviceKey" TEXT,
    "status" "DevicePairingStatus" NOT NULL DEFAULT 'PENDING',
    "headsetDeviceId" TEXT,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(6),
    "cancelledAt" TIMESTAMP(6),
    "supersededAt" TIMESTAMP(6),
    "expiredAt" TIMESTAMP(6),

    CONSTRAINT "DevicePairingAttempt_pkey" PRIMARY KEY ("id")
);

-- This migration intentionally fails if duplicate non-null device IDs already
-- exist. Run the documented duplicate audit before staging/production deploy.
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");
CREATE UNIQUE INDEX "DevicePairingAttempt_activeCode_key" ON "DevicePairingAttempt"("activeCode");
CREATE UNIQUE INDEX "DevicePairingAttempt_activeDeviceKey_key" ON "DevicePairingAttempt"("activeDeviceKey");
CREATE INDEX "device_pairing_attempt_deviceRecordId_status_idx" ON "DevicePairingAttempt"("deviceRecordId", "status");
CREATE INDEX "device_pairing_attempt_userId_status_idx" ON "DevicePairingAttempt"("userId", "status");
CREATE INDEX "device_pairing_attempt_code_completedAt_idx" ON "DevicePairingAttempt"("code", "completedAt");

ALTER TABLE "DevicePairingAttempt" ADD CONSTRAINT "device_pairing_attempt_deviceRecordId_fkey" FOREIGN KEY ("deviceRecordId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DevicePairingAttempt" ADD CONSTRAINT "device_pairing_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
