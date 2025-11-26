-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "geoElementTypes" AS ENUM ('COUNTRY', 'PROVINCE', 'DISTRICT', 'SUBDISTRICT', 'PLACE', 'LOCATION');

-- CreateEnum
CREATE TYPE "geoSystemTypes" AS ENUM ('GOOGLEMAPS', 'OPENSTREETMAP');

-- CreateEnum
CREATE TYPE "TypeScale" AS ENUM ('COUNTRY', 'PROVINCE', 'DISTRICT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_number" TEXT,
    "province" TEXT,
    "district" TEXT,
    "country" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_other" JSONB NOT NULL,
    "file_name" TEXT NOT NULL,
    "folder" TEXT,
    "size" TEXT,
    "geo" JSONB NOT NULL,
    "type" "TypeScale" NOT NULL DEFAULT 'COUNTRY',
    "add_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "area" JSONB,
    "type" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "add_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "type_position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_maps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "geo_type" "geoElementTypes" NOT NULL DEFAULT 'LOCATION',
    "metadata" JSON,
    "type_system" "geoSystemTypes" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_types" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255),
    "metadata" JSON,
    "type_system" "geoSystemTypes" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "type_position_name_key" ON "type_position"("name");

-- CreateIndex
CREATE INDEX "idx_geo_types_key" ON "geo_types"("key");

-- CreateIndex
CREATE INDEX "idx_geo_types_value" ON "geo_types"("value");

-- AddForeignKey
ALTER TABLE "place" ADD CONSTRAINT "place_add_by_fkey" FOREIGN KEY ("add_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_type_fkey" FOREIGN KEY ("type") REFERENCES "type_position"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_add_by_fkey" FOREIGN KEY ("add_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
