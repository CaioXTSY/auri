-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'PROFESSOR', 'ALUNO') NOT NULL DEFAULT 'ALUNO',
    `avatar` VARCHAR(191) NULL,
    `refresh_token` TEXT NULL,
    `reset_token` VARCHAR(191) NULL,
    `reset_token_expires` DATETIME(3) NULL,
    `current_streak` INTEGER NOT NULL DEFAULT 0,
    `longest_streak` INTEGER NOT NULL DEFAULT 0,
    `streak_last_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVA',
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `classes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_settings` (
    `id` VARCHAR(191) NOT NULL,
    `class_id` VARCHAR(191) NOT NULL,
    `allow_student_posts` BOOLEAN NOT NULL DEFAULT true,
    `allow_student_replies` BOOLEAN NOT NULL DEFAULT true,
    `require_post_approval` BOOLEAN NOT NULL DEFAULT false,
    `require_reply_approval` BOOLEAN NOT NULL DEFAULT false,
    `allow_join_by_code` BOOLEAN NOT NULL DEFAULT true,
    `require_join_approval` BOOLEAN NOT NULL DEFAULT false,
    `lock_enrollment` BOOLEAN NOT NULL DEFAULT false,
    `activities_enabled` BOOLEAN NOT NULL DEFAULT false,
    `allow_late_submissions` BOOLEAN NOT NULL DEFAULT false,
    `show_ranking_to_students` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `class_settings_class_id_key`(`class_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_join_requests` (
    `id` VARCHAR(191) NOT NULL,
    `class_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_at` DATETIME(3) NULL,
    `reviewed_by_id` VARCHAR(191) NULL,

    UNIQUE INDEX `class_join_requests_class_id_user_id_key`(`class_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_students` (
    `class_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`class_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_points` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `reference_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `icon` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `rarity` VARCHAR(191) NOT NULL DEFAULT 'COMUM',
    `condition` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `achievements_condition_key`(`condition`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `achievement_id` VARCHAR(191) NOT NULL,
    `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_achievements_user_id_achievement_id_key`(`user_id`, `achievement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rankings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `reference_id` VARCHAR(191) NULL,
    `position` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rankings_type_reference_id_position_idx`(`type`, `reference_id`, `position`),
    UNIQUE INDEX `rankings_user_id_type_reference_id_key`(`user_id`, `type`, `reference_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `missions` (
    `id` VARCHAR(191) NOT NULL,
    `class_id` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('DIARIA', 'SEMANAL', 'PERSONALIZADA') NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mission_quizzes` (
    `id` VARCHAR(191) NOT NULL,
    `mission_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `question` TEXT NOT NULL,
    `difficulty` ENUM('FACIL', 'MEDIO', 'DIFICIL') NOT NULL,
    `options` JSON NOT NULL,
    `explanations` JSON NOT NULL,
    `correct_index` INTEGER NOT NULL,
    `ai_generation_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `mission_quizzes_mission_id_key`(`mission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mission_quiz_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `mission_id` VARCHAR(191) NOT NULL,
    `mission_quiz_id` VARCHAR(191) NOT NULL,
    `selected_index` INTEGER NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `answered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `mission_quiz_attempts_user_id_mission_id_key`(`user_id`, `mission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_missions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `mission_id` VARCHAR(191) NOT NULL,
    `status` ENUM('NAO_INICIADA', 'EM_PROGRESSO', 'CONCLUIDA', 'EXPIRADA') NOT NULL DEFAULT 'NAO_INICIADA',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `completed_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_missions_user_id_mission_id_key`(`user_id`, `mission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_generations` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `response` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('SISTEMA', 'CONQUISTA', 'MISSAO', 'RANKING') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` VARCHAR(191) NOT NULL,
    `class_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_replies` (
    `id` VARCHAR(191) NOT NULL,
    `post_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programming_problems` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `statement` TEXT NOT NULL,
    `difficulty` ENUM('FACIL', 'MEDIO', 'DIFICIL') NOT NULL DEFAULT 'FACIL',
    `allowed_languages` JSON NOT NULL,
    `starter_code` JSON NOT NULL,
    `time_limit_ms` INTEGER NOT NULL DEFAULT 5000,
    `memory_limit_mb` INTEGER NOT NULL DEFAULT 128,
    `created_by_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problem_test_cases` (
    `id` VARCHAR(191) NOT NULL,
    `problem_id` VARCHAR(191) NOT NULL,
    `input` TEXT NOT NULL,
    `expected` TEXT NOT NULL,
    `visibility` ENUM('PUBLIC', 'HIDDEN') NOT NULL DEFAULT 'HIDDEN',
    `weight` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programming_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `problem_id` VARCHAR(191) NOT NULL,
    `class_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `due_date` DATETIME(3) NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `code_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `problem_id` VARCHAR(191) NOT NULL,
    `assignment_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `language` ENUM('JAVASCRIPT', 'PYTHON') NOT NULL,
    `code` TEXT NOT NULL,
    `mode` ENUM('RUN', 'SUBMIT') NOT NULL DEFAULT 'SUBMIT',
    `status` ENUM('PENDING', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'INTERNAL_ERROR') NOT NULL DEFAULT 'PENDING',
    `score` INTEGER NOT NULL DEFAULT 0,
    `points_awarded` INTEGER NOT NULL DEFAULT 0,
    `passed_tests` INTEGER NOT NULL DEFAULT 0,
    `total_tests` INTEGER NOT NULL DEFAULT 0,
    `runtime_ms` INTEGER NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `started_at` DATETIME(3) NULL,
    `judged_at` DATETIME(3) NULL,

    INDEX `code_submissions_status_created_at_idx`(`status`, `created_at`),
    INDEX `code_submissions_user_id_assignment_id_idx`(`user_id`, `assignment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_test_results` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `test_case_id` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'INTERNAL_ERROR') NOT NULL,
    `input_preview` TEXT NULL,
    `expected` TEXT NULL,
    `actual` TEXT NULL,
    `error_message` TEXT NULL,
    `runtime_ms` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(191) NOT NULL,
    `class_id` VARCHAR(191) NOT NULL,
    `created_by_id` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'FILE', 'QUIZ', 'CODE') NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `max_score` INTEGER NOT NULL DEFAULT 100,
    `xp_reward` INTEGER NOT NULL DEFAULT 0,
    `due_date` DATETIME(3) NULL,
    `allow_late_submissions` BOOLEAN NOT NULL DEFAULT false,
    `allow_resubmission` BOOLEAN NOT NULL DEFAULT false,
    `max_attempts` INTEGER NOT NULL DEFAULT 1,
    `allowed_file_types` JSON NULL,
    `max_file_size` INTEGER NOT NULL DEFAULT 10485760,
    `max_files` INTEGER NOT NULL DEFAULT 5,
    `show_results_immediately` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `activities_class_id_status_due_date_idx`(`class_id`, `status`, `due_date`),
    INDEX `activities_created_by_id_status_idx`(`created_by_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_questions` (
    `id` VARCHAR(191) NOT NULL,
    `activity_id` VARCHAR(191) NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER') NOT NULL,
    `prompt` TEXT NOT NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `position` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `activity_questions_activity_id_type_idx`(`activity_id`, `type`),
    UNIQUE INDEX `activity_questions_activity_id_position_key`(`activity_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT false,
    `position` INTEGER NOT NULL,

    INDEX `question_options_question_id_is_correct_idx`(`question_id`, `is_correct`),
    UNIQUE INDEX `question_options_question_id_position_key`(`question_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_materials` (
    `id` VARCHAR(191) NOT NULL,
    `activity_id` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `stored_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_materials_activity_id_idx`(`activity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `activity_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `attempt_number` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'LATE', 'UNDER_REVIEW', 'GRADED', 'RETURNED') NOT NULL DEFAULT 'DRAFT',
    `text_answer` TEXT NULL,
    `score` INTEGER NULL,
    `xp_awarded` INTEGER NOT NULL DEFAULT 0,
    `feedback` TEXT NULL,
    `submitted_at` DATETIME(3) NULL,
    `graded_at` DATETIME(3) NULL,
    `graded_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `activity_submissions_activity_id_status_submitted_at_idx`(`activity_id`, `status`, `submitted_at`),
    INDEX `activity_submissions_user_id_status_updated_at_idx`(`user_id`, `status`, `updated_at`),
    INDEX `activity_submissions_graded_by_id_idx`(`graded_by_id`),
    UNIQUE INDEX `activity_submissions_activity_id_user_id_attempt_number_key`(`activity_id`, `user_id`, `attempt_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `stored_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `submission_attachments_submission_id_idx`(`submission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_answers` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `question_id` VARCHAR(191) NOT NULL,
    `selected_option_id` VARCHAR(191) NULL,
    `text_answer` TEXT NULL,
    `score` INTEGER NULL,
    `feedback` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `question_answers_question_id_idx`(`question_id`),
    INDEX `question_answers_selected_option_id_idx`(`selected_option_id`),
    UNIQUE INDEX `question_answers_submission_id_question_id_key`(`submission_id`, `question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_settings` ADD CONSTRAINT `class_settings_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_join_requests` ADD CONSTRAINT `class_join_requests_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_join_requests` ADD CONSTRAINT `class_join_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_students` ADD CONSTRAINT `class_students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_points` ADD CONSTRAINT `user_points_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_achievement_id_fkey` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rankings` ADD CONSTRAINT `rankings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `missions` ADD CONSTRAINT `missions_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_quizzes` ADD CONSTRAINT `mission_quizzes_mission_id_fkey` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_quizzes` ADD CONSTRAINT `mission_quizzes_ai_generation_id_fkey` FOREIGN KEY (`ai_generation_id`) REFERENCES `ai_generations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_quiz_attempts` ADD CONSTRAINT `mission_quiz_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_quiz_attempts` ADD CONSTRAINT `mission_quiz_attempts_mission_id_fkey` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_quiz_attempts` ADD CONSTRAINT `mission_quiz_attempts_mission_quiz_id_fkey` FOREIGN KEY (`mission_quiz_id`) REFERENCES `mission_quizzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_missions` ADD CONSTRAINT `user_missions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_missions` ADD CONSTRAINT `user_missions_mission_id_fkey` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_replies` ADD CONSTRAINT `post_replies_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_replies` ADD CONSTRAINT `post_replies_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programming_problems` ADD CONSTRAINT `programming_problems_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_test_cases` ADD CONSTRAINT `problem_test_cases_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `programming_problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programming_assignments` ADD CONSTRAINT `programming_assignments_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `programming_problems`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programming_assignments` ADD CONSTRAINT `programming_assignments_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `code_submissions` ADD CONSTRAINT `code_submissions_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `programming_problems`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `code_submissions` ADD CONSTRAINT `code_submissions_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `programming_assignments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `code_submissions` ADD CONSTRAINT `code_submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_test_results` ADD CONSTRAINT `submission_test_results_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `code_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_test_results` ADD CONSTRAINT `submission_test_results_test_case_id_fkey` FOREIGN KEY (`test_case_id`) REFERENCES `problem_test_cases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_questions` ADD CONSTRAINT `activity_questions_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `activity_questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_materials` ADD CONSTRAINT `activity_materials_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_submissions` ADD CONSTRAINT `activity_submissions_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_submissions` ADD CONSTRAINT `activity_submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_submissions` ADD CONSTRAINT `activity_submissions_graded_by_id_fkey` FOREIGN KEY (`graded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_attachments` ADD CONSTRAINT `submission_attachments_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `activity_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_answers` ADD CONSTRAINT `question_answers_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `activity_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_answers` ADD CONSTRAINT `question_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `activity_questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_answers` ADD CONSTRAINT `question_answers_selected_option_id_fkey` FOREIGN KEY (`selected_option_id`) REFERENCES `question_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

