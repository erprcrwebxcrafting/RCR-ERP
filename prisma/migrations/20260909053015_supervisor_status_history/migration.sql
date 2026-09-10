-- CreateTable
CREATE TABLE "SupervisorStatusHistory" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupervisorStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupervisorStatusHistory_supervisorId_idx" ON "SupervisorStatusHistory"("supervisorId");

-- CreateIndex
CREATE INDEX "SupervisorStatusHistory_effectiveDate_idx" ON "SupervisorStatusHistory"("effectiveDate");

-- AddForeignKey
ALTER TABLE "SupervisorStatusHistory" ADD CONSTRAINT "SupervisorStatusHistory_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
