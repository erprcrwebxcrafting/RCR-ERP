import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany({ include: { client: true }});
  const bills = await prisma.runningBill.findMany({ include: { lines: true }});
  const payments = await prisma.payment.findMany();
  
  console.log(`--- DB STATS ---`);
  console.log(`Total Sites: ${sites.length}`);
  console.log(`Total Bills: ${bills.length}`);
  console.log(`Total Payments: ${payments.length}`);

  let totalBilledTaxable = 0;
  let totalBilledGross = 0;

  bills.forEach(b => {
    let lineSum = 0;
    b.lines.forEach(l => {
      lineSum += Number(l.currentAmount || 0);
    });
    totalBilledTaxable += lineSum;
    const cgst = lineSum * ((Number(b.cgstPct) || 9) / 100);
    const sgst = lineSum * ((Number(b.sgstPct) || 9) / 100);
    totalBilledGross += (lineSum + cgst + sgst);
  });

  let totalPayments = 0;
  payments.forEach(p => {
    totalPayments += Number(p.amount || 0);
  });

  console.log(`\n--- FINANCIALS ---`);
  console.log(`Total Billed (Taxable): ₹${totalBilledTaxable}`);
  console.log(`Total Billed (Gross/With Tax): ₹${totalBilledGross}`);
  console.log(`Total Payments Received: ₹${totalPayments}`);
  console.log(`Overall Outstanding (Gross - Paid): ₹${Math.max(0, totalBilledGross - totalPayments)}`);

  console.log(`\n--- SITE WISE (Top 3) ---`);
  const siteStats = sites.map(site => {
    const sBills = bills.filter(b => b.siteId === site.id);
    const sPayments = payments.filter(p => p.siteId === site.id);
    let sBilled = 0;
    sBills.forEach(b => {
      b.lines.forEach(l => { sBilled += Number(l.currentAmount || 0); });
    });
    let sPaid = 0;
    sPayments.forEach(p => { sPaid += Number(p.amount || 0); });
    return { name: site.projectName, billed: sBilled, paid: sPaid };
  });

  siteStats.slice(0, 3).forEach(s => {
    console.log(`${s.name} -> Billed: ₹${s.billed}, Paid: ₹${s.paid}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
