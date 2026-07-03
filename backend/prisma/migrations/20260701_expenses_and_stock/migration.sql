-- ── Gestão de gastos: categoria na sangria ───────────────────────────────────
CREATE TYPE "ExpenseCategory" AS ENUM (
  'PRODUTO',
  'COMBUSTIVEL',
  'MANUTENCAO',
  'SALARIO',
  'ALUGUEL',
  'CONTA',
  'OUTRO'
);

ALTER TABLE "cash_outflows"
  ADD COLUMN "category"  "ExpenseCategory" NOT NULL DEFAULT 'OUTRO',
  ADD COLUMN "supplier"  TEXT,
  ADD COLUMN "date"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── Gestão de estoque ─────────────────────────────────────────────────────────
CREATE TABLE "products" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "unit"        TEXT NOT NULL DEFAULT 'unidade',
  "quantity"    DECIMAL(10,3) NOT NULL DEFAULT 0,
  "minQuantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "costPrice"   DECIMAL(10,2),
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- Entradas de estoque (compras/reposição)
CREATE TABLE "stock_entries" (
  "id"          TEXT NOT NULL,
  "productId"   TEXT NOT NULL,
  "quantity"    DECIMAL(10,3) NOT NULL,
  "costPrice"   DECIMAL(10,2),
  "supplier"    TEXT,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stock_entries_productId_fkey" FOREIGN KEY ("productId")
    REFERENCES "products"("id") ON DELETE CASCADE
);

-- Uso de produtos por OS
CREATE TABLE "product_usages" (
  "id"             TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "productId"      TEXT NOT NULL,
  "quantity"       DECIMAL(10,3) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_usages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_usages_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId")
    REFERENCES "service_orders"("id") ON DELETE CASCADE,
  CONSTRAINT "product_usages_productId_fkey" FOREIGN KEY ("productId")
    REFERENCES "products"("id")
);

CREATE INDEX "stock_entries_productId_idx" ON "stock_entries"("productId");
CREATE INDEX "product_usages_serviceOrderId_idx" ON "product_usages"("serviceOrderId");
CREATE INDEX "product_usages_productId_idx" ON "product_usages"("productId");

-- ── Gerenciamento financeiro: contas e reservas ───────────────────────────────
CREATE TYPE "BillStatus" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO');

CREATE TABLE "bills" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "category"    "ExpenseCategory" NOT NULL DEFAULT 'OUTRO',
  "amount"      DECIMAL(10,2) NOT NULL,
  "dueDate"     DATE NOT NULL,
  "status"      "BillStatus" NOT NULL DEFAULT 'PENDENTE',
  "paidAt"      TIMESTAMP(3),
  "notes"       TEXT,
  "recurring"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bills_dueDate_idx"  ON "bills"("dueDate");
CREATE INDEX "bills_status_idx"   ON "bills"("status");
