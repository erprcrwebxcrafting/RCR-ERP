import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBulkAttendanceCardBuffer, generateAttendanceCardBuffer, AttendanceCardData } from "@/lib/pdf/attendance-card";
import { formatPresentStr } from "@/lib/attendance-calc";
import JSZip from "jszip";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for batch PDF compilation on Vercel

function buildCardDataFromMemory({
  workerName,
  siteName,
  rate,
  initialDbBalance,
  attendances,
  payments,
  openingEarned,
  openingPaid,
  dateParam,
  role,
}: {
  workerName: string;
  siteName: string;
  rate: number;
  initialDbBalance: number;
  attendances: any[];
  payments: any[];
  openingEarned: number;
  openingPaid: number;
  dateParam: Date;
  role: "Labour" | "Supervisor";
}): AttendanceCardData {
  const year = dateParam.getFullYear();
  const month = dateParam.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const attMap = new Map<string, any[]>();
  attendances.forEach(a => {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!attMap.has(key)) attMap.set(key, []);
    attMap.get(key)!.push(a);
  });

  const payMap = new Map<string, any[]>();
  payments.forEach(p => {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!payMap.has(key)) payMap.set(key, []);
    payMap.get(key)!.push(p);
  });

  const days: AttendanceCardData["days"] = [];
  let totalDays = 0;
  let totalEarned = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const attKey = `${year}-${month}-${i}`;
    const dayAtts = attMap.get(attKey) || [];

    let advMonth = month;
    let advYear = year;
    let advDateNumRaw = 20 + i;
    let advDateNum = advDateNumRaw;
    if (advDateNumRaw > daysInMonth) {
      advMonth += 1;
      if (advMonth > 11) {
        advMonth = 0;
        advYear += 1;
      }
      advDateNum -= daysInMonth;
    }

    const payKey = `${advYear}-${advMonth}-${advDateNum}`;
    const dayPays = payMap.get(payKey) || [];

    let dayHajari = 0;
    dayAtts.forEach(a => {
      if (a.hajari !== undefined) {
        dayHajari += (a.hajari || 0);
      } else if (a.status) {
        if (a.status === 'PRESENT') dayHajari += 1;
        else if (a.status === 'HALF_DAY') dayHajari += 0.5;
      }
    });
    totalDays += dayHajari;

    dayAtts.forEach(a => {
      if (a.hajari !== undefined) {
        const appliedRate = a.hajariRate || rate;
        totalEarned += (a.hajari || 0) * appliedRate;
      } else if (a.status) {
        const earned = a.earnedAmount !== undefined && a.earnedAmount !== null
          ? a.earnedAmount
          : (a.dailyRate || rate) * (a.status === 'PRESENT' ? 1 : a.status === 'HALF_DAY' ? 0.5 : 0);
        totalEarned += earned;
      }
    });

    let dayAdvance = 0;
    let reasons: string[] = [];
    dayPays.forEach(p => {
      dayAdvance += (p.amount || 0);
      if (p.reason) reasons.push(p.reason);
    });

    dayAtts.forEach(a => {
      if (a.site && a.site.projectName && a.site.projectName !== siteName) {
        if (!reasons.includes(`Site: ${a.site.projectName}`)) {
          reasons.push(`Site: ${a.site.projectName}`);
        }
      }
      if (a.remarks && !reasons.includes(a.remarks)) {
        reasons.push(a.remarks);
      }
    });

    const presentStr = formatPresentStr(dayHajari, dayAtts.length > 0);
    const fullDateStr = `${i}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    const advFullDateStr = `${advDateNum}/${(advMonth + 1).toString().padStart(2, '0')}/${advYear}`;

    days.push({
      dateNum: i,
      fullDateStr,
      presentStr: presentStr,
      advDateNum: advDateNum,
      advFullDateStr,
      advanceAmt: dayAdvance !== 0 ? dayAdvance : null,
      remarks: reasons.join(", ")
    });
  }

  const totalAdvance = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const openingBalance = Math.round((openingEarned - openingPaid + initialDbBalance) * 100) / 100;
  const balancePayable = Math.round((totalEarned - totalAdvance + openingBalance) * 100) / 100;
  const finalDeductions = openingBalance < 0 ? Math.abs(openingBalance) : 0;

  let finalRate = rate;
  if (totalDays > 0 && totalEarned > 0) {
    finalRate = totalEarned / totalDays;
  }

  const factoryName = `R.C.R Enterprises ${siteName}`;
  const monthName = dateParam.toLocaleString('default', { month: 'long', year: 'numeric' });

  return {
    factoryName,
    workerName,
    monthName,
    rate: Math.round(finalRate * 100) / 100,
    days,
    totalDays: Math.round(totalDays * 100) / 100,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalAdvance: Math.round(totalAdvance * 100) / 100,
    deductions: Math.round(finalDeductions * 100) / 100,
    balancePayable,
    openingBalance,
    role,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const monthParam = searchParams.get("month"); // Format: "YYYY-MM-DD"
    
    if (!siteId || !monthParam) {
      return new NextResponse("Missing required parameters: siteId and month", { status: 400 });
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return new NextResponse("Site not found", { status: 404 });

    const dateParam = new Date(monthParam);
    if (isNaN(dateParam.getTime())) {
      return new NextResponse("Invalid month parameter", { status: 400 });
    }

    const year = dateParam.getFullYear();
    const month = dateParam.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const fromDate = new Date(year, month, 1, 0, 0, 0, 0);
    const toDate = new Date(year, month, daysInMonth, 23, 59, 59, 999);
    const payStart = new Date(year, month, 21, 0, 0, 0, 0);
    const payEnd = new Date(year, month + 1, 20, 23, 59, 59, 999);

    // 1. Fetch active labours for this site
    const labours = await prisma.labour.findMany({
      where: { siteId, active: true },
      include: { site: true, labourCategory: true }
    });
    const labourIds = labours.map(l => l.id);

    // 2. Fetch supervisors for this site safely
    const siteSupervisors = await prisma.siteSupervisor.findMany({
      where: { siteId },
      include: {
        supervisor: {
          include: { assignedSites: { include: { site: true } } }
        }
      }
    });
    const supervisors = siteSupervisors
      .map(ss => ss.supervisor)
      .filter((s): s is NonNullable<typeof s> => !!s && s.active);
    const supervisorIds = supervisors.map(s => s.id);

    // 3. Batch query ALL attendance & payment records for site workers simultaneously
    const [
      labourAtts,
      labourPays,
      pastLabourAtts,
      pastLabourPays,
      supAtts,
      supPays,
      pastSupAtts,
      pastSupPays,
    ] = await Promise.all([
      labourIds.length > 0
        ? prisma.attendance.findMany({
            where: { labourId: { in: labourIds }, date: { gte: fromDate, lte: toDate } },
            orderBy: { date: "asc" },
            include: { site: { select: { projectName: true } } },
          })
        : [],
      labourIds.length > 0
        ? prisma.labourPayment.findMany({
            where: { labourId: { in: labourIds }, date: { gte: payStart, lte: payEnd } },
            orderBy: { date: "asc" },
          })
        : [],
      labourIds.length > 0
        ? prisma.attendance.findMany({
            where: { labourId: { in: labourIds }, date: { lt: fromDate }, hajari: { gt: 0 } },
            select: { labourId: true, hajari: true, hajariRate: true },
          })
        : [],
      labourIds.length > 0
        ? prisma.labourPayment.groupBy({
            by: ["labourId"],
            where: { labourId: { in: labourIds }, date: { lt: payStart } },
            _sum: { amount: true },
          })
        : [],
      supervisorIds.length > 0
        ? prisma.supervisorAttendance.findMany({
            where: { supervisorId: { in: supervisorIds }, date: { gte: fromDate, lte: toDate } },
            orderBy: { date: "asc" },
          })
        : [],
      supervisorIds.length > 0
        ? prisma.supervisorPayment.findMany({
            where: { supervisorId: { in: supervisorIds }, date: { gte: payStart, lte: payEnd } },
            orderBy: { date: "asc" },
          })
        : [],
      supervisorIds.length > 0
        ? prisma.supervisorAttendance.findMany({
            where: { supervisorId: { in: supervisorIds }, date: { lt: fromDate }, status: { not: "ABSENT" } },
            select: { supervisorId: true, status: true, dailyRate: true, earnedAmount: true },
          })
        : [],
      supervisorIds.length > 0
        ? prisma.supervisorPayment.groupBy({
            by: ["supervisorId"],
            where: { supervisorId: { in: supervisorIds }, date: { lt: payStart } },
            _sum: { amount: true },
          })
        : [],
    ]);

    // Fast memory lookups for labours
    const labourAttMap = new Map<string, any[]>();
    labourAtts.forEach(a => {
      if (!labourAttMap.has(a.labourId)) labourAttMap.set(a.labourId, []);
      labourAttMap.get(a.labourId)!.push(a);
    });

    const labourPayMap = new Map<string, any[]>();
    labourPays.forEach(p => {
      if (!labourPayMap.has(p.labourId)) labourPayMap.set(p.labourId, []);
      labourPayMap.get(p.labourId)!.push(p);
    });

    const labourRateMap = new Map<string, number>();
    labours.forEach(l => {
      const rate = l.dailyWage || l.labourCategory?.dailyWage || 0;
      labourRateMap.set(l.id, rate);
    });

    const pastLabourEarnedMap = new Map<string, number>();
    pastLabourAtts.forEach(a => {
      const appliedRate = a.hajariRate || labourRateMap.get(a.labourId) || 0;
      const earned = (a.hajari || 0) * appliedRate;
      pastLabourEarnedMap.set(a.labourId, (pastLabourEarnedMap.get(a.labourId) || 0) + earned);
    });

    const pastLabourPaidMap = new Map<string, number>();
    pastLabourPays.forEach(p => {
      pastLabourPaidMap.set(p.labourId, p._sum.amount || 0);
    });

    // Fast memory lookups for supervisors
    const supAttMap = new Map<string, any[]>();
    supAtts.forEach(a => {
      if (!supAttMap.has(a.supervisorId)) supAttMap.set(a.supervisorId, []);
      supAttMap.get(a.supervisorId)!.push(a);
    });

    const supPayMap = new Map<string, any[]>();
    supPays.forEach(p => {
      if (!supPayMap.has(p.supervisorId)) supPayMap.set(p.supervisorId, []);
      supPayMap.get(p.supervisorId)!.push(p);
    });

    const supRateMap = new Map<string, number>();
    supervisors.forEach(s => {
      const rate = s.monthlySalary ? Math.round((s.monthlySalary / daysInMonth) * 100) / 100 : 0;
      supRateMap.set(s.id, rate);
    });

    const pastSupEarnedMap = new Map<string, number>();
    pastSupAtts.forEach(a => {
      const defaultRate = supRateMap.get(a.supervisorId) || 0;
      const earned = a.earnedAmount !== undefined && a.earnedAmount !== null
        ? a.earnedAmount
        : (a.dailyRate || defaultRate) * (a.status === 'PRESENT' ? 1 : a.status === 'HALF_DAY' ? 0.5 : 0);
      pastSupEarnedMap.set(a.supervisorId, (pastSupEarnedMap.get(a.supervisorId) || 0) + earned);
    });

    const pastSupPaidMap = new Map<string, number>();
    pastSupPays.forEach(p => {
      pastSupPaidMap.set(p.supervisorId, p._sum.amount || 0);
    });

    // Build all labour cards in memory
    const allCardsData: AttendanceCardData[] = [];

    labours.forEach(labour => {
      const rate = labourRateMap.get(labour.id) || 0;
      const initialDbBalance = labour.openingBalance || 0;
      const siteName = labour.site?.projectName || site.projectName || "";
      const attendances = labourAttMap.get(labour.id) || [];
      const payments = labourPayMap.get(labour.id) || [];
      const openingEarned = pastLabourEarnedMap.get(labour.id) || 0;
      const openingPaid = pastLabourPaidMap.get(labour.id) || 0;

      const card = buildCardDataFromMemory({
        workerName: labour.name,
        siteName,
        rate,
        initialDbBalance,
        attendances,
        payments,
        openingEarned,
        openingPaid,
        dateParam,
        role: "Labour",
      });
      allCardsData.push(card);
    });

    // Build all supervisor cards in memory
    supervisors.forEach(supervisor => {
      const rate = supRateMap.get(supervisor.id) || 0;
      const siteName = supervisor.assignedSites?.map(s => s.site.projectName).join(", ") || site.projectName || "";
      const attendances = supAttMap.get(supervisor.id) || [];
      const payments = supPayMap.get(supervisor.id) || [];
      const openingEarned = pastSupEarnedMap.get(supervisor.id) || 0;
      const openingPaid = pastSupPaidMap.get(supervisor.id) || 0;

      const card = buildCardDataFromMemory({
        workerName: supervisor.name,
        siteName,
        rate,
        initialDbBalance: 0,
        attendances,
        payments,
        openingEarned,
        openingPaid,
        dateParam,
        role: "Supervisor",
      });
      allCardsData.push(card);
    });

    // Filter to active cards that have attendance, payments, open balance, or any remarks in this month
    const activeCards = allCardsData.filter(c =>
      c.totalDays > 0 ||
      c.totalAdvance > 0 ||
      Math.abs(c.balancePayable) > 0 ||
      c.days.some(d => d.presentStr !== "")
    );
    const finalCards = activeCards.length > 0 ? activeCards : allCardsData;

    if (finalCards.length === 0) {
      return new NextResponse("No attendance data found for this site in this month", { status: 404 });
    }

    // Attach logo safely
    try {
      const fs = require("fs");
      const path = require("path");
      const logoPath = path.join(process.cwd(), "public", "rcr-logo.png");
      if (fs.existsSync(logoPath)) {
        const imageBuffer = fs.readFileSync(logoPath);
        const logoStr = `data:image/png;base64,${imageBuffer.toString("base64")}`;
        finalCards.forEach(card => {
          card.logoStr = logoStr;
        });
      }
    } catch (e) {
      console.error("Failed to load logo for bulk cards", e);
    }

    const format = searchParams.get("format"); // "zip" or "pdf" (default)
    const monthName = dateParam.toLocaleString('default', { month: 'short', year: 'numeric' });
    const safeProjectName = site.projectName.replace(/[^a-zA-Z0-9]/g, "_");

    if (format === "zip") {
      const zip = new JSZip();
      const cardBatchSize = 6;
      for (let i = 0; i < finalCards.length; i += cardBatchSize) {
        const batch = finalCards.slice(i, i + cardBatchSize);
        await Promise.all(
          batch.map(async (card, idx) => {
            const index = i + idx + 1;
            const singleBuffer = await generateAttendanceCardBuffer(card);
            const role = card.role || "Worker";
            const cleanName = (card.workerName || "Worker")
              .replace(/[^a-zA-Z0-9_\-\s]/g, "")
              .trim()
              .replace(/\s+/g, "_");
            const padIndex = String(index).padStart(2, "0");
            const cardFileName = `${padIndex}_${role}_${cleanName}_${monthName.replace(/\s+/g, "_")}.pdf`;
            zip.file(cardFileName, singleBuffer);
          })
        );
      }

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      const zipFilename = `${safeProjectName}_Hajri_Cards_${monthName.replace(/\s+/g, "_")}.zip`;

      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${zipFilename}"`,
        },
      });
    }

    const pdfBuffer = await generateBulkAttendanceCardBuffer(finalCards);
    const filename = `${safeProjectName}_Bulk_Cards_${monthName.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error("Bulk Site Attendance Card Export Error:", error);
    return new NextResponse(error.message || "Failed to export bulk attendance cards", { status: 500 });
  }
}
