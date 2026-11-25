-- CreateIndex
CREATE INDEX "users_school_id_idx" ON "users"("school_id");

-- CreateIndex
CREATE INDEX "users_discord_id_idx" ON "users"("discord_id");

-- CreateIndex
CREATE INDEX "Transaction_user_id_idx" ON "Transaction"("user_id");

-- CreateIndex
CREATE INDEX "classrooms_school_id_idx" ON "classrooms"("school_id");

-- CreateIndex
CREATE INDEX "classroom_announces_classroom_id_idx" ON "classroom_announces"("classroom_id");

-- CreateIndex
CREATE INDEX "classroom_users_classroomId_idx" ON "classroom_users"("classroomId");

-- CreateIndex
CREATE INDEX "game_sessions_creator_id_idx" ON "game_sessions"("creator_id");

-- CreateIndex
CREATE INDEX "classroom_games_game_id_idx" ON "classroom_games"("game_id");

-- CreateIndex
CREATE INDEX "tutor_sessions_discord_channel_id_created_at_idx" ON "tutor_sessions"("discord_channel_id", "created_at");

-- CreateIndex
CREATE INDEX "tutor_sessions_host_id_idx" ON "tutor_sessions"("host_id");

-- CreateIndex
CREATE INDEX "tutor_voice_logs_tutor_id_created_at_idx" ON "tutor_voice_logs"("tutor_id", "created_at");

-- CreateIndex
CREATE INDEX "classroom_tutors_tutor_id_idx" ON "classroom_tutors"("tutor_id");

-- CreateIndex
CREATE INDEX "classroom_tutors_classroom_id_idx" ON "classroom_tutors"("classroom_id");

-- CreateIndex
CREATE INDEX "assignments_creator_id_idx" ON "assignments"("creator_id");

-- CreateIndex
CREATE INDEX "classroom_assignments_assignment_id_classroom_id_idx" ON "classroom_assignments"("assignment_id", "classroom_id");

-- CreateIndex
CREATE INDEX "classroom_assignments_classroom_id_idx" ON "classroom_assignments"("classroom_id");

-- CreateIndex
CREATE INDEX "homework_submissions_assignment_id_idx" ON "homework_submissions"("assignment_id");

-- CreateIndex
CREATE INDEX "homework_submissions_user_id_idx" ON "homework_submissions"("user_id");

-- CreateIndex
CREATE INDEX "attendances_active_game_id_idx" ON "attendances"("active_game_id");

-- CreateIndex
CREATE INDEX "attendances_active_tutor_id_idx" ON "attendances"("active_tutor_id");

-- CreateIndex
CREATE INDEX "attendances_homework_submission_id_idx" ON "attendances"("homework_submission_id");

