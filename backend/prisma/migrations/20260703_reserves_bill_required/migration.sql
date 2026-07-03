-- Make description nullable
ALTER TABLE "financial_reserves" ALTER COLUMN "description" DROP NOT NULL;

-- Drop usedAt column (no longer needed)
ALTER TABLE "financial_reserves" DROP COLUMN IF EXISTS "usedAt";

-- Drop old FK (SetNull) and remove reserves without a bill
ALTER TABLE "financial_reserves" DROP CONSTRAINT IF EXISTS "financial_reserves_billId_fkey";
DELETE FROM "financial_reserves" WHERE "billId" IS NULL;

-- Make billId required
ALTER TABLE "financial_reserves" ALTER COLUMN "billId" SET NOT NULL;

-- Add new FK with CASCADE (when bill is deleted, its reserves go too)
ALTER TABLE "financial_reserves"
    ADD CONSTRAINT "financial_reserves_billId_fkey"
    FOREIGN KEY ("billId") REFERENCES "bills"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
