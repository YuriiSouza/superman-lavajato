-- AlterTable
ALTER TABLE "services" ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "highlight" BOOLEAN NOT NULL DEFAULT false;
