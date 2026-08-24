-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monthlySalary" DOUBLE PRECISION,
    "aadharNumber" TEXT,
    "accountNumber" TEXT,
    "address" TEXT,
    "bankBranch" TEXT,
    "bankName" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "ifscCode" TEXT,
    "passwordVersion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "gstNo" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "address" TEXT,
    "gstNo" TEXT,
    "retentionPct" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "cgstPct" DOUBLE PRECISION NOT NULL DEFAULT 9,
    "sgstPct" DOUBLE PRECISION NOT NULL DEFAULT 9,
    "tdsPct" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "remarks" TEXT,
    "workOrderNo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSupervisor" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,

    CONSTRAINT "SiteSupervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approxArea" DOUBLE PRECISION DEFAULT 0,
    "contractRate" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buWork" DOUBLE PRECISION,
    "remarks" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildingId" TEXT,
    "currentQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partAmount" DOUBLE PRECISION DEFAULT 0,
    "previousPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeAmt" DOUBLE PRECISION DEFAULT 0,
    "cumulativePct" DOUBLE PRECISION DEFAULT 0,
    "currentAmt" DOUBLE PRECISION DEFAULT 0,
    "previousAmt" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourCategory" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dailyWage" DOUBLE PRECISION NOT NULL,
    "overtimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LabourCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Labour" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "labourCategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "joiningDate" TIMESTAMP(3),
    "aadharNumber" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "bankBranch" TEXT,
    "supervisorId" TEXT,
    "dailyWage" DOUBLE PRECISION,
    "overtimeRate" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bankName" TEXT,

    CONSTRAINT "Labour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourPayment" (
    "id" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorPayment" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupervisorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "buildingId" TEXT,
    "labourId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "hajari" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hajariRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHrs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "markedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourEntry" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "labourId" TEXT NOT NULL,
    "presentDays" DOUBLE PRECISION NOT NULL,
    "overtimeHrs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyWage" DOUBLE PRECISION NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "siteId" TEXT,
    "clientId" TEXT,
    "projectName" TEXT,
    "quotationNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT NOT NULL,
    "termsJson" TEXT NOT NULL,
    "exclusionsJson" TEXT,
    "itemsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyLabourEntry" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challanNo" TEXT,
    "description" TEXT NOT NULL,
    "fitterQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fitterHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fitterRate" DOUBLE PRECISION NOT NULL DEFAULT 1100,
    "helperQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "helperHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "helperRate" DOUBLE PRECISION NOT NULL DEFAULT 800,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runningBillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyLabourEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunningBill" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "refNo" TEXT,
    "billDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "cgstPct" DOUBLE PRECISION NOT NULL DEFAULT 9,
    "sgstPct" DOUBLE PRECISION NOT NULL DEFAULT 9,
    "tdsPct" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "retentionPct" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunningBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillLine" (
    "id" TEXT NOT NULL,
    "runningBillId" TEXT NOT NULL,
    "buildingId" TEXT,
    "workItemId" TEXT,
    "labourCategoryId" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "woQty" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL,
    "previousQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isSupplyLabour" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BillLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "mode" TEXT NOT NULL,
    "accountCredited" TEXT,
    "reference" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourTransferHistory" (
    "id" TEXT NOT NULL,
    "labourId" TEXT NOT NULL,
    "fromSiteId" TEXT,
    "toSiteId" TEXT NOT NULL,
    "fromSupervisorId" TEXT,
    "toSupervisorId" TEXT,
    "previousDailyWage" DOUBLE PRECISION,
    "newDailyWage" DOUBLE PRECISION,
    "previousOvertimeRate" DOUBLE PRECISION,
    "newOvertimeRate" DOUBLE PRECISION,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabourTransferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorTransferHistory" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "fromSiteId" TEXT,
    "toSiteId" TEXT NOT NULL,
    "laboursTransferred" INTEGER NOT NULL DEFAULT 0,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupervisorTransferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "companyName" TEXT NOT NULL DEFAULT 'RCR ENTERPRISES',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notifySupervisorLogins" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorAttendance" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "earnedAmount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupervisorAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteExpense" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidTo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Site_clientId_idx" ON "Site"("clientId");

-- CreateIndex
CREATE INDEX "SiteSupervisor_siteId_idx" ON "SiteSupervisor"("siteId");

-- CreateIndex
CREATE INDEX "SiteSupervisor_supervisorId_idx" ON "SiteSupervisor"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSupervisor_siteId_supervisorId_key" ON "SiteSupervisor"("siteId", "supervisorId");

-- CreateIndex
CREATE INDEX "Building_siteId_idx" ON "Building"("siteId");

-- CreateIndex
CREATE INDEX "WorkItem_siteId_idx" ON "WorkItem"("siteId");

-- CreateIndex
CREATE INDEX "WorkItem_buildingId_idx" ON "WorkItem"("buildingId");

-- CreateIndex
CREATE INDEX "LabourCategory_siteId_idx" ON "LabourCategory"("siteId");

-- CreateIndex
CREATE INDEX "Labour_siteId_idx" ON "Labour"("siteId");

-- CreateIndex
CREATE INDEX "Labour_labourCategoryId_idx" ON "Labour"("labourCategoryId");

-- CreateIndex
CREATE INDEX "Labour_supervisorId_idx" ON "Labour"("supervisorId");

-- CreateIndex
CREATE INDEX "Labour_active_idx" ON "Labour"("active");

-- CreateIndex
CREATE INDEX "LabourPayment_labourId_idx" ON "LabourPayment"("labourId");

-- CreateIndex
CREATE INDEX "LabourPayment_date_idx" ON "LabourPayment"("date");

-- CreateIndex
CREATE INDEX "SupervisorPayment_supervisorId_idx" ON "SupervisorPayment"("supervisorId");

-- CreateIndex
CREATE INDEX "Attendance_siteId_date_idx" ON "Attendance"("siteId", "date");

-- CreateIndex
CREATE INDEX "Attendance_buildingId_idx" ON "Attendance"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_labourId_date_key" ON "Attendance"("labourId", "date");

-- CreateIndex
CREATE INDEX "LabourEntry_siteId_idx" ON "LabourEntry"("siteId");

-- CreateIndex
CREATE INDEX "LabourEntry_labourId_idx" ON "LabourEntry"("labourId");

-- CreateIndex
CREATE INDEX "Quotation_clientId_idx" ON "Quotation"("clientId");

-- CreateIndex
CREATE INDEX "Quotation_siteId_idx" ON "Quotation"("siteId");

-- CreateIndex
CREATE INDEX "SupplyLabourEntry_siteId_idx" ON "SupplyLabourEntry"("siteId");

-- CreateIndex
CREATE INDEX "SupplyLabourEntry_runningBillId_idx" ON "SupplyLabourEntry"("runningBillId");

-- CreateIndex
CREATE INDEX "RunningBill_siteId_idx" ON "RunningBill"("siteId");

-- CreateIndex
CREATE INDEX "RunningBill_billDate_idx" ON "RunningBill"("billDate");

-- CreateIndex
CREATE INDEX "RunningBill_status_idx" ON "RunningBill"("status");

-- CreateIndex
CREATE INDEX "BillLine_runningBillId_idx" ON "BillLine"("runningBillId");

-- CreateIndex
CREATE INDEX "BillLine_buildingId_idx" ON "BillLine"("buildingId");

-- CreateIndex
CREATE INDEX "BillLine_workItemId_idx" ON "BillLine"("workItemId");

-- CreateIndex
CREATE INDEX "BillLine_labourCategoryId_idx" ON "BillLine"("labourCategoryId");

-- CreateIndex
CREATE INDEX "Payment_siteId_idx" ON "Payment"("siteId");

-- CreateIndex
CREATE INDEX "Payment_date_idx" ON "Payment"("date");

-- CreateIndex
CREATE INDEX "SupervisorAttendance_supervisorId_date_idx" ON "SupervisorAttendance"("supervisorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SupervisorAttendance_supervisorId_date_key" ON "SupervisorAttendance"("supervisorId", "date");

-- CreateIndex
CREATE INDEX "OtpToken_email_idx" ON "OtpToken"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_code_key" ON "ShareLink"("code");

-- CreateIndex
CREATE INDEX "ShareLink_code_idx" ON "ShareLink"("code");

-- CreateIndex
CREATE INDEX "SiteExpense_siteId_idx" ON "SiteExpense"("siteId");

-- CreateIndex
CREATE INDEX "SiteExpense_date_idx" ON "SiteExpense"("date");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSupervisor" ADD CONSTRAINT "SiteSupervisor_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSupervisor" ADD CONSTRAINT "SiteSupervisor_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourCategory" ADD CONSTRAINT "LabourCategory_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labour" ADD CONSTRAINT "Labour_labourCategoryId_fkey" FOREIGN KEY ("labourCategoryId") REFERENCES "LabourCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labour" ADD CONSTRAINT "Labour_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labour" ADD CONSTRAINT "Labour_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourPayment" ADD CONSTRAINT "LabourPayment_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorPayment" ADD CONSTRAINT "SupervisorPayment_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourEntry" ADD CONSTRAINT "LabourEntry_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourEntry" ADD CONSTRAINT "LabourEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyLabourEntry" ADD CONSTRAINT "SupplyLabourEntry_runningBillId_fkey" FOREIGN KEY ("runningBillId") REFERENCES "RunningBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyLabourEntry" ADD CONSTRAINT "SupplyLabourEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunningBill" ADD CONSTRAINT "RunningBill_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLine" ADD CONSTRAINT "BillLine_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLine" ADD CONSTRAINT "BillLine_labourCategoryId_fkey" FOREIGN KEY ("labourCategoryId") REFERENCES "LabourCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLine" ADD CONSTRAINT "BillLine_runningBillId_fkey" FOREIGN KEY ("runningBillId") REFERENCES "RunningBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillLine" ADD CONSTRAINT "BillLine_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourTransferHistory" ADD CONSTRAINT "LabourTransferHistory_fromSiteId_fkey" FOREIGN KEY ("fromSiteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourTransferHistory" ADD CONSTRAINT "LabourTransferHistory_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourTransferHistory" ADD CONSTRAINT "LabourTransferHistory_toSiteId_fkey" FOREIGN KEY ("toSiteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorTransferHistory" ADD CONSTRAINT "SupervisorTransferHistory_fromSiteId_fkey" FOREIGN KEY ("fromSiteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorTransferHistory" ADD CONSTRAINT "SupervisorTransferHistory_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorTransferHistory" ADD CONSTRAINT "SupervisorTransferHistory_toSiteId_fkey" FOREIGN KEY ("toSiteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorAttendance" ADD CONSTRAINT "SupervisorAttendance_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteExpense" ADD CONSTRAINT "SiteExpense_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

