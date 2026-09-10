-- CreateTable
CREATE TABLE "LabourStatusHistory" (
    "id" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabourStatusHistory_labourId_idx" ON "LabourStatusHistory"("labourId");

-- CreateIndex
CREATE INDEX "LabourStatusHistory_effectiveDate_idx" ON "LabourStatusHistory"("effectiveDate");

-- AddForeignKey
ALTER TABLE "LabourStatusHistory" ADD CONSTRAINT "LabourStatusHistory_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
