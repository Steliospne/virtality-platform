-- CreateTable
CREATE TABLE "WaitingList" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,

    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
);
