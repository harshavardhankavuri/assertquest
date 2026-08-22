-- AlterTable
ALTER TABLE "th_users" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "th_users" ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "th_users" ADD COLUMN "publicRealName" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "th_users" ALTER COLUMN "passwordHash" DROP DEFAULT;
ALTER TABLE "th_users" ALTER COLUMN "displayName" DROP DEFAULT;

-- CreateTable
CREATE TABLE "th_discussion_posts" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "th_discussion_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "th_discussion_posts_challengeId_idx" ON "th_discussion_posts"("challengeId");

-- AddForeignKey
ALTER TABLE "th_discussion_posts" ADD CONSTRAINT "th_discussion_posts_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "th_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "th_discussion_posts" ADD CONSTRAINT "th_discussion_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "th_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
