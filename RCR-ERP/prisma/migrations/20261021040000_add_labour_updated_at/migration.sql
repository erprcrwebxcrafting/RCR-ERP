-- AlterTable
ALTER TABLE "Labour" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Initialize with createdAt
UPDATE "Labour" SET "updatedAt" = "createdAt";

-- Update with latest attendance if more recent
UPDATE "Labour" l
SET "updatedAt" = sub.max_att
FROM (
  SELECT "labourId", MAX("createdAt") AS max_att
  FROM "Attendance"
  GROUP BY "labourId"
) sub
WHERE l.id = sub."labourId" AND sub.max_att > l."updatedAt";

-- Update with latest payment if more recent
UPDATE "Labour" l
SET "updatedAt" = sub.max_pay
FROM (
  SELECT "labourId", MAX("createdAt") AS max_pay
  FROM "LabourPayment"
  GROUP BY "labourId"
) sub
WHERE l.id = sub."labourId" AND sub.max_pay > l."updatedAt";
