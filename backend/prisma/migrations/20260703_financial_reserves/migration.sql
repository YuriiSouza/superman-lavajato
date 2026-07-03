-- CreateTable: financial_reserves
CREATE TABLE "financial_reserves" (
    "id"          TEXT NOT NULL,
    "amount"      DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "usedAt"      TIMESTAMP(3),
    "billId"      TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_reserves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_reserves_billId_idx" ON "financial_reserves"("billId");

-- AddForeignKey
ALTER TABLE "financial_reserves"
    ADD CONSTRAINT "financial_reserves_billId_fkey"
    FOREIGN KEY ("billId") REFERENCES "bills"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
