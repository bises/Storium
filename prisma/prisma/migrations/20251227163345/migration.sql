/*
  Warnings:

  - You are about to drop the column `role` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `space_id` on the `members` table. All the data in the column will be lost.
  - Added the required column `password` to the `members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_id` to the `spaces` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_space_id_fkey";

-- DropIndex
DROP INDEX "members_space_id_idx";

-- DropIndex
DROP INDEX "members_space_id_name_idx";

-- AlterTable
ALTER TABLE "members" DROP COLUMN "role",
DROP COLUMN "space_id",
ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "owner_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "space_memberships" (
    "member_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_memberships_pkey" PRIMARY KEY ("member_id","space_id")
);

-- CreateIndex
CREATE INDEX "space_memberships_member_id_idx" ON "space_memberships"("member_id");

-- CreateIndex
CREATE INDEX "space_memberships_space_id_idx" ON "space_memberships"("space_id");

-- CreateIndex
CREATE INDEX "spaces_owner_id_idx" ON "spaces"("owner_id");

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_memberships" ADD CONSTRAINT "space_memberships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_memberships" ADD CONSTRAINT "space_memberships_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
