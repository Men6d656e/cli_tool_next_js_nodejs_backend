-- CreateTable
CREATE TABLE "deviceCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceCode" TEXT NOT NULL,
    "userCode" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "lastPolledAt" DATETIME,
    "pollingInterval" INTEGER,
    "clientId" TEXT,
    "scope" TEXT
);
