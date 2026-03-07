-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'ONGOING', 'FINISHED');

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "point_boss" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "classroom_users" ADD COLUMN     "is_rewarded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN     "damage_boost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "max_hp_boss" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "GameStatus" NOT NULL DEFAULT 'WAITING',
ADD COLUMN     "time_limit" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "tutor_voice_logs" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "topic" TEXT,
    "summary" TEXT,
    "data_content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_voice_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tutor_voice_logs" ADD CONSTRAINT "tutor_voice_logs_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
