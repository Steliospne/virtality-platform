-- CreateIndex
CREATE INDEX "PendingPromotionCode_status_expiresAt_idx" ON "PendingPromotionCode"("status", "expiresAt");
