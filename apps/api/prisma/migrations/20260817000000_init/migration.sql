-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'dispatcher', 'driver', 'customer');

-- CreateEnum
CREATE TYPE "ChallengeDifficulty" AS ENUM ('light', 'standard', 'heavy', 'bulk');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('open', 'in_progress', 'cleared');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "th_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'learner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "th_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "th_challenges" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "ChallengeDifficulty" NOT NULL,
    "surfaceTags" TEXT[],
    "estimatedMinutes" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "successCondition" TEXT NOT NULL,
    "hints" TEXT[],

    CONSTRAINT "th_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "th_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'open',
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "th_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "th_users_email_key" ON "th_users"("email");

-- CreateIndex
CREATE INDEX "th_challenges_module_idx" ON "th_challenges"("module");

-- CreateIndex
CREATE UNIQUE INDEX "th_progress_userId_challengeId_key" ON "th_progress"("userId", "challengeId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "th_progress" ADD CONSTRAINT "th_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "th_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "th_progress" ADD CONSTRAINT "th_progress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "th_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
