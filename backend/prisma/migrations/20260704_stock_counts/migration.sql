CREATE TABLE "stock_counts" (
    "id"        TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity"  DECIMAL(10,3) NOT NULL,
    "costPrice" DECIMAL(10,2),
    "notes"     TEXT,
    "countedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_counts_productId_idx" ON "stock_counts"("productId");
CREATE INDEX "stock_counts_countedAt_idx" ON "stock_counts"("countedAt");

ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
