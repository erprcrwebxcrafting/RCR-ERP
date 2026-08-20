import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedBillsPayments = async () => {
  console.log("Starting Step 6: Seeding Bills, Advances & Payments (Balance Sheet)...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(today.getDate() - 10);

  const sites = await prisma.site.findMany({
    include: {
      workItems: true,
      labours: {
        include: { attendances: true }
      },
      supervisors: {
        include: { supervisor: { include: { supervisorAttendances: true } } }
      }
    }
  });

  if (sites.length === 0) {
    console.error("No sites found.");
    return;
  }

  let totalBills = 0;
  let totalAdvances = 0;
  let totalPayments = 0;

  for (const site of sites) {
    // 1. Generate Running Bill
    if (site.workItems.length > 0) {
      const bill = await prisma.runningBill.create({
        data: {
          siteId: site.id,
          billNo: `RA/01/${site.projectName.substring(0,3).toUpperCase()}`,
          billDate: today,
          periodLabel: "First RA Bill",
          status: "APPROVED",
          cgstPct: site.cgstPct,
          sgstPct: site.sgstPct,
          tdsPct: site.tdsPct,
          retentionPct: site.retentionPct,
        }
      });
      totalBills++;

      // Create Bill Lines
      let order = 1;
      let totalBillAmount = 0;
      for (const item of site.workItems) {
        if (item.currentQty > 0) {
          const amount = item.currentQty * item.rate;
          totalBillAmount += amount;
          await prisma.billLine.create({
            data: {
              runningBillId: bill.id,
              workItemId: item.id,
              description: item.name,
              unit: item.unit,
              rate: item.rate,
              currentQty: item.currentQty,
              currentAmount: amount,
              cumulativeQty: item.currentQty,
              cumulativeAmount: amount,
              order: order++,
            }
          });
        }
      }

      // 2. Generate Payment from Client (Credit) for this Bill
      // Assuming 90% of the bill was paid
      if (totalBillAmount > 0) {
        const paidAmount = totalBillAmount * 0.9;
        await prisma.payment.create({
          data: {
            siteId: site.id,
            date: today,
            amount: paidAmount,
            mode: "NEFT",
            reference: `NEFT-${Math.floor(Math.random() * 1000000)}`,
            remarks: "Payment against RA/01",
          }
        });
      }
    }

    // 3. Generate Labour Advances & Final Payments
    for (const labour of site.labours) {
      // Calculate total salary earned
      let totalEarned = 0;
      for (const att of labour.attendances) {
        totalEarned += att.hajari * att.hajariRate;
        if (att.overtimeHrs && labour.overtimeRate) {
          totalEarned += att.overtimeHrs * labour.overtimeRate;
        }
      }

      if (totalEarned > 0) {
        // Randomly give an advance mid-month
        const advanceAmount = Math.floor(Math.random() * (totalEarned * 0.4)); // up to 40% advance
        if (advanceAmount > 500) {
          await prisma.labourPayment.create({
            data: {
              labourId: labour.id,
              amount: advanceAmount,
              date: tenDaysAgo,
              reason: "Advance (Upaad)",
            }
          });
          totalAdvances++;
        }

        // Final Payment
        const finalDue = totalEarned - advanceAmount;
        if (finalDue > 0) {
          await prisma.labourPayment.create({
            data: {
              labourId: labour.id,
              amount: finalDue,
              date: today,
              reason: "Final Salary Settlement",
            }
          });
          totalPayments++;
        }
      }
    }

    // 4. Generate Supervisor Payments
    for (const siteSup of site.supervisors) {
      const sup = siteSup.supervisor;
      let totalEarned = 0;
      for (const att of sup.supervisorAttendances) {
        totalEarned += att.earnedAmount;
      }

      if (totalEarned > 0) {
        await prisma.supervisorPayment.create({
          data: {
            supervisorId: sup.id,
            amount: totalEarned,
            date: today,
            reason: "Monthly Salary Settlement"
          }
        });
      }
    }
    
    console.log(`Generated Bills and Payments for ${site.projectName}`);
  }

  console.log(`Step 6 Complete. Generated ${totalBills} RA Bills, ${totalAdvances} Labour Advances, and ${totalPayments} Final Salary Payments.`);
};

seedBillsPayments()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
