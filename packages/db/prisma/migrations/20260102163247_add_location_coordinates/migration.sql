-- AlterTable
ALTER TABLE "events" ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLng" DOUBLE PRECISION,
ADD COLUMN     "locationPlaceId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hometownLat" DOUBLE PRECISION,
ADD COLUMN     "hometownLng" DOUBLE PRECISION,
ADD COLUMN     "hometownPlaceId" TEXT;
