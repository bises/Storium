-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('ROOT', 'FLOOR', 'ROOM', 'CONTAINER', 'OTHER');

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "space_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location_type" "LocationType",
    "nfc_tag" TEXT,
    "barcode" TEXT,
    "qr_code" TEXT,
    "parent_location_id" TEXT,
    "space_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "image_url" TEXT,
    "nfc_tag" TEXT,
    "barcode" TEXT,
    "qr_code" TEXT,
    "location_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "last_moved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "space_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_tags" (
    "item_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_tags_pkey" PRIMARY KEY ("item_id","tag_id")
);

-- CreateTable
CREATE TABLE "movement_history" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "from_location_id" TEXT,
    "to_location_id" TEXT NOT NULL,
    "moved_by_id" TEXT NOT NULL,
    "moved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "movement_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spaces_name_idx" ON "spaces"("name");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_space_id_idx" ON "members"("space_id");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_space_id_name_idx" ON "members"("space_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "locations_nfc_tag_key" ON "locations"("nfc_tag");

-- CreateIndex
CREATE UNIQUE INDEX "locations_barcode_key" ON "locations"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "locations_qr_code_key" ON "locations"("qr_code");

-- CreateIndex
CREATE INDEX "locations_space_id_idx" ON "locations"("space_id");

-- CreateIndex
CREATE INDEX "locations_parent_location_id_idx" ON "locations"("parent_location_id");

-- CreateIndex
CREATE INDEX "locations_nfc_tag_idx" ON "locations"("nfc_tag");

-- CreateIndex
CREATE INDEX "locations_barcode_idx" ON "locations"("barcode");

-- CreateIndex
CREATE INDEX "locations_qr_code_idx" ON "locations"("qr_code");

-- CreateIndex
CREATE INDEX "locations_name_idx" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "items_nfc_tag_key" ON "items"("nfc_tag");

-- CreateIndex
CREATE UNIQUE INDEX "items_barcode_key" ON "items"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "items_qr_code_key" ON "items"("qr_code");

-- CreateIndex
CREATE INDEX "items_space_id_idx" ON "items"("space_id");

-- CreateIndex
CREATE INDEX "items_location_id_idx" ON "items"("location_id");

-- CreateIndex
CREATE INDEX "items_nfc_tag_idx" ON "items"("nfc_tag");

-- CreateIndex
CREATE INDEX "items_barcode_idx" ON "items"("barcode");

-- CreateIndex
CREATE INDEX "items_qr_code_idx" ON "items"("qr_code");

-- CreateIndex
CREATE INDEX "items_name_idx" ON "items"("name");

-- CreateIndex
CREATE INDEX "tags_space_id_idx" ON "tags"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_space_id_name_key" ON "tags"("space_id", "name");

-- CreateIndex
CREATE INDEX "movement_history_item_id_idx" ON "movement_history"("item_id");

-- CreateIndex
CREATE INDEX "movement_history_moved_at_idx" ON "movement_history"("moved_at");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_last_moved_by_id_fkey" FOREIGN KEY ("last_moved_by_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_history" ADD CONSTRAINT "movement_history_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_history" ADD CONSTRAINT "movement_history_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_history" ADD CONSTRAINT "movement_history_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_history" ADD CONSTRAINT "movement_history_moved_by_id_fkey" FOREIGN KEY ("moved_by_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
