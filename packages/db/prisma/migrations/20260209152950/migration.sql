-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('ATTACK_BOOST', 'TIME_EXTEND');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "student_id" TEXT,
    "teacher_id" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "major" TEXT,
    "school_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hover_image" TEXT,
    "file_pdf" TEXT,
    "announce" TEXT,
    "title" TEXT,
    "school_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_announces" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "file_pdf" TEXT,
    "classroom_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_announces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_users" (
    "userId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "classroom_users_pkey" PRIMARY KEY ("userId","classroomId")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creator_id" TEXT,
    "character_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "boss_name" TEXT NOT NULL,
    "max_hp" INTEGER NOT NULL,
    "time_limit" INTEGER NOT NULL,
    "description" TEXT,
    "model_url" TEXT,
    "image_url" TEXT,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_games" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "current_hp" INTEGER NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,

    CONSTRAINT "classroom_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_sessions" (
    "id" TEXT NOT NULL,
    "topic" TEXT,
    "summary" TEXT,
    "data_content" JSONB NOT NULL,
    "discord_channel_id" TEXT NOT NULL,
    "bot_link" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "host_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_tutors" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_tutors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Assignment',
    "chat_history" JSONB,
    "file_pdf" TEXT,
    "text_content" TEXT,
    "generated_content" TEXT,
    "generated_file_txt" TEXT,
    "grading_criteria" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "creator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_assignments" (
    "id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,

    CONSTRAINT "classroom_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_submissions" (
    "id" TEXT NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transcription" TEXT,
    "ai_feedback" TEXT,
    "score" INTEGER DEFAULT 0,
    "assignment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "effect_value" INTEGER NOT NULL,
    "type" "ItemType" NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_items" (
    "game_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_items_pkey" PRIMARY KEY ("game_id","item_id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "scoreEarned" INTEGER NOT NULL DEFAULT 0,
    "damage_dealt" INTEGER NOT NULL DEFAULT 0,
    "status" "CheckStatus" NOT NULL DEFAULT 'PRESENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "active_game_id" TEXT,
    "active_tutor_id" TEXT,
    "homework_submission_id" TEXT,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_name_key" ON "schools"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_code_key" ON "classrooms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_games_classroom_id_game_id_key" ON "classroom_games"("classroom_id", "game_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_items_user_id_item_id_key" ON "user_items"("user_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_user_id_active_game_id_key" ON "attendances"("user_id", "active_game_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_user_id_active_tutor_id_key" ON "attendances"("user_id", "active_tutor_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_user_id_homework_submission_id_key" ON "attendances"("user_id", "homework_submission_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_announces" ADD CONSTRAINT "classroom_announces_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_announces" ADD CONSTRAINT "classroom_announces_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_users" ADD CONSTRAINT "classroom_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_users" ADD CONSTRAINT "classroom_users_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_games" ADD CONSTRAINT "classroom_games_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_games" ADD CONSTRAINT "classroom_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_sessions" ADD CONSTRAINT "tutor_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_tutors" ADD CONSTRAINT "classroom_tutors_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_tutors" ADD CONSTRAINT "classroom_tutors_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutor_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_assignments" ADD CONSTRAINT "classroom_assignments_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_assignments" ADD CONSTRAINT "classroom_assignments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "classroom_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_items" ADD CONSTRAINT "game_items_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_items" ADD CONSTRAINT "game_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_active_game_id_fkey" FOREIGN KEY ("active_game_id") REFERENCES "classroom_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_active_tutor_id_fkey" FOREIGN KEY ("active_tutor_id") REFERENCES "classroom_tutors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_homework_submission_id_fkey" FOREIGN KEY ("homework_submission_id") REFERENCES "homework_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
