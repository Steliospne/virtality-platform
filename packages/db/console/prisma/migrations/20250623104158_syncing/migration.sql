-- CreateTable
CREATE TABLE "WaitingList" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan" TEXT,

    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
);
