-- Índices de performance adicionados para acelerar queries frequentes

-- ServiceOrder: vehicleId e serviceId usados em filtros financeiros e de OS
CREATE INDEX IF NOT EXISTS "service_orders_vehicleId_idx" ON "service_orders"("vehicleId");
CREATE INDEX IF NOT EXISTS "service_orders_serviceId_idx" ON "service_orders"("serviceId");

-- Índice composto (status, createdAt) para queries do dashboard e financeiro
CREATE INDEX IF NOT EXISTS "service_orders_status_createdAt_idx" ON "service_orders"("status", "createdAt");

-- OrderPayment: createdAt para queries do caixa por período
CREATE INDEX IF NOT EXISTS "order_payments_createdAt_idx" ON "order_payments"("createdAt");

-- StockCount: índice composto (productId, countedAt) para cálculo de CMV
CREATE INDEX IF NOT EXISTS "stock_counts_productId_countedAt_idx" ON "stock_counts"("productId", "countedAt");
