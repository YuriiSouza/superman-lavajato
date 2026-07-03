-- DropForeignKey
ALTER TABLE "service_orders" DROP CONSTRAINT "service_orders_clientId_fkey";

-- DropForeignKey
ALTER TABLE "service_orders" DROP CONSTRAINT "service_orders_vehicleId_fkey";

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
