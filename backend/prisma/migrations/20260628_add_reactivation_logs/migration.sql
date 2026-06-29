CREATE TABLE "reactivation_logs" (
  "id"        TEXT NOT NULL,
  "clientId"  TEXT NOT NULL,
  "sentAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "daysSince" INTEGER,
  "message"   TEXT NOT NULL,
  CONSTRAINT "reactivation_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reactivation_logs_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "reactivation_logs_clientId_idx" ON "reactivation_logs"("clientId");
CREATE INDEX "reactivation_logs_sentAt_idx"   ON "reactivation_logs"("sentAt");
