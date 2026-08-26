-- CreateTable
CREATE TABLE "LabourWageHistory" (
    "id" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "dailyWage" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourWageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorWageHistory" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "monthlySalary" DOUBLE PRECISION,
    "dailyWage" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupervisorWageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabourWageHistory_labourId_idx" ON "LabourWageHistory"("labourId");

-- CreateIndex
CREATE INDEX "LabourWageHistory_effectiveDate_idx" ON "LabourWageHistory"("effectiveDate");

-- CreateIndex
CREATE INDEX "SupervisorWageHistory_supervisorId_idx" ON "SupervisorWageHistory"("supervisorId");

-- CreateIndex
CREATE INDEX "SupervisorWageHistory_effectiveDate_idx" ON "SupervisorWageHistory"("effectiveDate");

-- AddForeignKey
ALTER TABLE "LabourWageHistory" ADD CONSTRAINT "LabourWageHistory_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorWageHistory" ADD CONSTRAINT "SupervisorWageHistory_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
