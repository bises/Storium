/*
  Warnings:

  - You are about to drop the column `barcode` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `nfc_tag` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `qr_code` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `barcode` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `nfc_tag` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `qr_code` on the `locations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[item_reference_id]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[location_reference_id]` on the table `locations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('NFC', 'QR_CODE', 'BARCODE', 'MANUAL');

-- DropIndex
DROP INDEX "items_barcode_idx";

-- DropIndex
DROP INDEX "items_barcode_key";

-- DropIndex
DROP INDEX "items_nfc_tag_idx";

-- DropIndex
DROP INDEX "items_nfc_tag_key";

-- DropIndex
DROP INDEX "items_qr_code_idx";

-- DropIndex
DROP INDEX "items_qr_code_key";

-- DropIndex
DROP INDEX "locations_barcode_idx";

-- DropIndex
DROP INDEX "locations_barcode_key";

-- DropIndex
DROP INDEX "locations_nfc_tag_idx";

-- DropIndex
DROP INDEX "locations_nfc_tag_key";

-- DropIndex
DROP INDEX "locations_qr_code_idx";

-- DropIndex
DROP INDEX "locations_qr_code_key";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "barcode",
DROP COLUMN "nfc_tag",
DROP COLUMN "qr_code",
ADD COLUMN     "item_reference_id" TEXT,
ADD COLUMN     "reference_type" "ReferenceType";

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "barcode",
DROP COLUMN "nfc_tag",
DROP COLUMN "qr_code",
ADD COLUMN     "location_reference_id" TEXT,
ADD COLUMN     "reference_type" "ReferenceType";

-- CreateIndex
CREATE UNIQUE INDEX "items_item_reference_id_key" ON "items"("item_reference_id");

-- CreateIndex
CREATE INDEX "items_item_reference_id_idx" ON "items"("item_reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_location_reference_id_key" ON "locations"("location_reference_id");

-- CreateIndex
CREATE INDEX "locations_location_reference_id_idx" ON "locations"("location_reference_id");
