CREATE TABLE "cash_sessions" (
  "id"             TEXT NOT NULL,
  "date"           TEXT NOT NULL,
  "openedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt"       TIMESTAMP(3),
  "openingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "physicalCount"  DECIMAL(10,2),
  "operatorName"   TEXT NOT NULL,
  CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cash_sessions_date_key" ON "cash_sessions"("date");

CREATE TABLE "cash_outflows" (
  "id"        TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "amount"    DECIMAL(10,2) NOT NULL,
  "reason"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cash_outflows_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cash_outflows_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "cash_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
