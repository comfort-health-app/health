-- CreateTable
CREATE TABLE
 "PurchaseLocation" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "sortOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "userId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "PurchaseLocation_pkey" PRIMARY KEY ("id")
 );

-- CreateIndex
CREATE INDEX "PurchaseLocation_userId_idx" ON "PurchaseLocation" ("userId");

-- CreateIndex
CREATE INDEX "PurchaseLocation_userId_active_idx" ON "PurchaseLocation" ("userId", "active");

-- AddForeignKey
ALTER TABLE "PurchaseLocation" ADD CONSTRAINT "PurchaseLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Purchase"
ADD COLUMN "expectedArrivalUndefined" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Purchase"
ADD COLUMN "purchaseLocationId" INTEGER;

-- AlterTable
ALTER TABLE "Purchase"
ADD COLUMN "purchaseLocation" TEXT;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_purchaseLocationId_fkey" FOREIGN KEY ("purchaseLocationId") REFERENCES "PurchaseLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
