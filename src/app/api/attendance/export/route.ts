import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAttendanceExcel } from "@/lib/excel/attendance";
import { generateAttendancePdf } from "@/lib/pdf/attendance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const labourId = searchParams.get("labourId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const format = searchParams.get("format");
    const q = searchParams.get("q") || "";

    if ((!siteId && !labourId) || !startDateStr || !endDateStr || !format) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    let siteName = "Unknown Site";
    
    if (labourId) {
      const labour = await prisma.labour.findUnique({ where: { id: labourId }, include: { site: true } });
      if (!labour) return new NextResponse("Labour not found", { status: 404 });
      siteName = labour.site.projectName;
    } else if (siteId) {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) return new NextResponse("Site not found", { status: 404 });
      siteName = site.projectName;
    }

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (labourId) whereClause.labourId = labourId;
    if (siteId && !labourId) whereClause.siteId = siteId;

    if (q) {
      whereClause.OR = [
        { labour: { name: { contains: q, mode: "insensitive" } } },
        { site: { projectName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: [
        { date: "asc" },
        { labour: { labourCategory: { name: "asc" } } },
        { labour: { name: "asc" } }
      ],
      include: {
        labour: { include: { labourCategory: true } },
        building: true,
      },
    });

    // Collect all relevant labour IDs
    const labourIdSet = new Set<string>();
    attendances.forEach(a => labourIdSet.add(a.labourId));
    if (labourId) {
      labourIdSet.add(labourId);
    } else if (siteId && !q) {
      // Include all active labours of this site
      const siteLabours = await prisma.labour.findMany({
        where: { siteId, active: true },
        select: { id: true }
      });
      siteLabours.forEach(l => labourIdSet.add(l.id));
    }
    const allLabourIds = Array.from(labourIdSet);

    // Fetch payments in this period for these labours
    const payments = await prisma.labourPayment.findMany({
      where: {
        labourId: { in: allLabourIds },
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });

    // Fetch details for any labours who had payments or belong to the site but had no attendance in the period
    const missingLabourIds = allLabourIds.filter(id => !attendances.some(a => a.labourId === id));
    let additionalLabours: any[] = [];
    if (missingLabourIds.length > 0) {
      additionalLabours = await prisma.labour.findMany({
        where: { id: { in: missingLabourIds } },
        include: { labourCategory: true },
      });
    }

    // Fetch prior attendance and payments before startDate to calculate opening/previous balances
    const [prevAttendances, prevPayments] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          labourId: { in: allLabourIds },
          date: { lt: startDate },
          hajari: { gt: 0 }
        },
        select: {
          labourId: true,
          hajari: true,
          hajariRate: true,
          labour: { select: { dailyWage: true } }
        }
      }),
      prisma.labourPayment.findMany({
        where: {
          labourId: { in: allLabourIds },
          date: { lt: startDate }
        },
        select: {
          labourId: true,
          amount: true
        }
      })
    ]);

    const openingEarned: Record<string, number> = {};
    const openingPaid: Record<string, number> = {};
    for (const pa of prevAttendances) {
      const rate = pa.hajariRate || pa.labour?.dailyWage || 0;
      openingEarned[pa.labourId] = (openingEarned[pa.labourId] || 0) + (pa.hajari * rate);
    }
    for (const pp of prevPayments) {
      openingPaid[pp.labourId] = (openingPaid[pp.labourId] || 0) + pp.amount;
    }

    // Fetch payments made AFTER the endDate up to today
    const postPayments = await prisma.labourPayment.findMany({
      where: {
        labourId: { in: allLabourIds },
        date: { gt: endDate },
      },
      orderBy: { date: "asc" },
    });

    // --- SUPERVISOR INTEGRATION ---
    // Fetch all supervisors assigned to this site (if filtering by site)
    if (siteId && !labourId) {
      const siteSupervisors = await prisma.siteSupervisor.findMany({
        where: { siteId },
        include: { supervisor: true }
      });
      const supervisorUserIds = siteSupervisors.map(ss => ss.supervisorId);

      if (supervisorUserIds.length > 0) {
        // Fetch Supervisor Attendances in this period
        const supAttendances = await prisma.supervisorAttendance.findMany({
          where: { supervisorId: { in: supervisorUserIds }, date: { gte: startDate, lte: endDate } },
          include: { supervisor: true }
        });
        
        // Fetch Supervisor Payments in this period
        const supPayments = await prisma.supervisorPayment.findMany({
          where: { supervisorId: { in: supervisorUserIds }, date: { gte: startDate, lte: endDate } }
        });

        // Fetch Supervisor Payments AFTER this period
        const postSupPayments = await prisma.supervisorPayment.findMany({
          where: { supervisorId: { in: supervisorUserIds }, date: { gt: endDate } }
        });

        // Fetch prior balances for Supervisors
        const [prevSupAtt, prevSupPay] = await Promise.all([
          prisma.supervisorAttendance.findMany({
            where: { supervisorId: { in: supervisorUserIds }, date: { lt: startDate } }
          }),
          prisma.supervisorPayment.findMany({
            where: { supervisorId: { in: supervisorUserIds }, date: { lt: startDate } }
          })
        ]);

        // Map Supervisor Attendances to Labour Attendance shape
        for (const sa of supAttendances) {
          const supLabId = `sup_${sa.supervisorId}`;
          const isPresent = sa.status === "PRESENT";
          const isHalf = sa.status === "HALF_DAY";
          
          attendances.push({
            id: sa.id,
            siteId: siteId,
            buildingId: null,
            labourId: supLabId,
            date: sa.date,
            status: sa.status,
            hajari: isPresent ? 1 : (isHalf ? 0.5 : 0),
            hajariRate: sa.dailyRate,
            earnedAmount: sa.earnedAmount, // explicitly pass earnedAmount for correct calculation
            overtimeHrs: 0,
            remarks: sa.remarks,
            markedById: sa.markedById || "",
            createdAt: sa.createdAt,
            building: null,
            labour: {
              id: supLabId,
              siteId: siteId,
              labourCategoryId: "cat_sup",
              name: sa.supervisor.name,
              phone: sa.supervisor.phone,
              dailyWage: sa.dailyRate, // We use dailyRate as their base wage for this record
              active: sa.supervisor.active,
              labourCategory: {
                id: "cat_sup",
                siteId: siteId,
                name: "SUPERVISOR",
                dailyWage: 0
              }
            }
          } as any);
        }

        // Add supervisors who didn't have attendance but had payments or just belong to the site
        const activeSupIdSet = new Set(supAttendances.map(sa => `sup_${sa.supervisorId}`));
        for (const ss of siteSupervisors) {
          const supLabId = `sup_${ss.supervisorId}`;
          if (!activeSupIdSet.has(supLabId)) {
            additionalLabours.push({
              id: supLabId,
              name: ss.supervisor.name,
              dailyWage: ss.supervisor.monthlySalary ? Math.round(ss.supervisor.monthlySalary / 30) : 0,
              labourCategory: { name: "SUPERVISOR" }
            } as any);
          }
        }

        // Map Supervisor Payments
        for (const sp of supPayments) {
          payments.push({
            id: sp.id,
            labourId: `sup_${sp.supervisorId}`,
            amount: sp.amount,
            date: sp.date,
            reason: sp.reason,
            transactionId: sp.transactionId,
            createdAt: sp.createdAt
          } as any);
        }

        // Calculate Supervisor Opening Balances
        for (const psa of prevSupAtt) {
          const supLabId = `sup_${psa.supervisorId}`;
          openingEarned[supLabId] = (openingEarned[supLabId] || 0) + psa.earnedAmount;
        }
        for (const psp of prevSupPay) {
          const supLabId = `sup_${psp.supervisorId}`;
          openingPaid[supLabId] = (openingPaid[supLabId] || 0) + psp.amount;
        }

        // Map Post Supervisor Payments
        for (const psp of postSupPayments) {
          postPayments.push({
            id: psp.id,
            labourId: `sup_${psp.supervisorId}`,
            amount: psp.amount,
            date: psp.date,
            reason: psp.reason,
            transactionId: psp.transactionId,
            createdAt: psp.createdAt
          } as any);
        }
      }
    }
    // --- END SUPERVISOR INTEGRATION ---

    const exportData = {
      attendances,
      payments,
      postPayments,
      additionalLabours,
      openingEarned,
      openingPaid,
      siteName,
      startDateStr,
      endDateStr,
    };

    if (format === "excel") {
      const buffer = await generateAttendanceExcel(exportData);
      return new NextResponse(buffer as any, {
        headers: {
          "Content-Disposition": `attachment; filename="Attendance_${siteName.replace(/\s+/g, "_")}_${startDateStr}_to_${endDateStr}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    } else if (format === "pdf") {
      const buffer = await generateAttendancePdf(exportData);
      return new NextResponse(buffer as any, {
        headers: {
          "Content-Disposition": `attachment; filename="Attendance_${siteName.replace(/\s+/g, "_")}_${startDateStr}_to_${endDateStr}.pdf"`,
          "Content-Type": "application/pdf",
        },
      });
    } else {
      return new NextResponse("Invalid format", { status: 400 });
    }
  } catch (error) {
    console.error("Error generating export:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
