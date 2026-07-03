-- CreateTable service_categories
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresVehicle" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- Add categoryId to services
ALTER TABLE "services" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Make clientId and vehicleId nullable on service_orders
ALTER TABLE "service_orders" ALTER COLUMN "clientId" DROP NOT NULL;
ALTER TABLE "service_orders" ALTER COLUMN "vehicleId" DROP NOT NULL;

-- Add new columns to service_orders
ALTER TABLE "service_orders" ADD COLUMN "customerDescription" TEXT;
ALTER TABLE "service_orders" ADD COLUMN "scheduledAt" TIMESTAMP(3);
