-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('booked', 'in_transit', 'delivered');

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN "status" "ShipmentStatus" NOT NULL DEFAULT 'booked';
ALTER TABLE "shipments" ADD COLUMN "currentLat" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "shipments" ADD COLUMN "currentLng" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "shipments" ADD COLUMN "positionUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill any existing rows so currentLat/currentLng start at the origin instead of 0,0
UPDATE "shipments" SET "currentLat" = "originLat", "currentLng" = "originLng";

-- Drop the temporary defaults now that existing rows are backfilled — new rows must
-- supply these explicitly (application always does, via createBooking).
ALTER TABLE "shipments" ALTER COLUMN "currentLat" DROP DEFAULT;
ALTER TABLE "shipments" ALTER COLUMN "currentLng" DROP DEFAULT;
