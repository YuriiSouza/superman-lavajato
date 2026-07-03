-- DropForeignKey
ALTER TABLE "product_usages" DROP CONSTRAINT "product_usages_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_usages" DROP CONSTRAINT "product_usages_serviceOrderId_fkey";

-- DropForeignKey
ALTER TABLE "stock_entries" DROP CONSTRAINT "stock_entries_productId_fkey";

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_usages" ADD CONSTRAINT "product_usages_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_usages" ADD CONSTRAINT "product_usages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
