-- Columns that were added to schema.prisma (and applied with `db push`)
-- without a migration. Brings the migration history in line with the schema.

-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tutor_sessions" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- AlterTable
ALTER TABLE "tutor_voice_logs" ADD COLUMN IF NOT EXISTS "audio_url" TEXT;

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "answer_file" JSONB;
