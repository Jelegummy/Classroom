/*
  Warnings:

  - You are about to drop the `geo_maps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `geo_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `place` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `type_position` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "place" DROP CONSTRAINT "place_add_by_fkey";

-- DropForeignKey
ALTER TABLE "position" DROP CONSTRAINT "position_add_by_fkey";

-- DropForeignKey
ALTER TABLE "position" DROP CONSTRAINT "position_place_id_fkey";

-- DropForeignKey
ALTER TABLE "position" DROP CONSTRAINT "position_type_fkey";

-- DropTable
DROP TABLE "geo_maps";

-- DropTable
DROP TABLE "geo_types";

-- DropTable
DROP TABLE "place";

-- DropTable
DROP TABLE "position";

-- DropTable
DROP TABLE "type_position";

-- DropEnum
DROP TYPE "TypeScale";

-- DropEnum
DROP TYPE "geoElementTypes";

-- DropEnum
DROP TYPE "geoSystemTypes";
