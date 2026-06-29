ALTER TABLE "service_orders" ALTER COLUMN "paymentMethod" DROP NOT NULL;

CREATE TABLE "order_payments" (
  "id"             TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "method"         "PaymentMethod" NOT NULL,
  "amount"         DECIMAL(10,2) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_payments_serviceOrderId_fkey"
    FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE
);

CREATE INDEX "order_payments_serviceOrderId_idx" ON "order_payments"("serviceOrderId");
