-- CreateEnum
CREATE TYPE "ReportJobStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- CreateTable
CREATE TABLE "report_jobs" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "groupBy" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "status" "ReportJobStatus" NOT NULL DEFAULT 'pending',
    "resultCsv" BYTEA,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3),

    CONSTRAINT "report_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_jobs_requestedById_idx" ON "report_jobs"("requestedById");

-- AddForeignKey
ALTER TABLE "report_jobs" ADD CONSTRAINT "report_jobs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
