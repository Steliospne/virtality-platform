-- CreateTable
CREATE TABLE "TesterCode" (
    "id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "usedAt" TIMESTAMP(6),
    "usedBy" TEXT,

    CONSTRAINT "TesterCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TesterCode_usedBy_key" ON "TesterCode"("usedBy");

-- AddForeignKey
ALTER TABLE "TesterCode" ADD CONSTRAINT "TesterCode_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
