import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { HistoricalBillViewer } from "@/app/admin/sites/[id]/bills/[billId]/historical-bill-viewer";

export default async function DedicatedBillDetailPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  
  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: {
      site: {
        include: { 
          client: true,
          buildings: true,
          payments: { orderBy: { date: "asc" } },
        }
      },
      lines: { 
        include: { building: true, workItem: true, labourCategory: true } 
      },
      supplyLabourEntries: {
        orderBy: { date: "asc" }
      },
    },
  });

  if (!bill) notFound();

  return (
    <div className="space-y-6">
      <HistoricalBillViewer bill={bill} />
    </div>
  );
}
