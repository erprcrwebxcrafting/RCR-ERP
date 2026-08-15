import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { HistoricalBillViewer } from "./historical-bill-viewer";

export default async function RunningBillDetailPage({ params }: { params: Promise<{ id: string; billId: string }> }) {
  const { id, billId } = await params;
  
  const bill = await prisma.runningBill.findUnique({
    where: { id: billId },
    include: {
      site: {
        include: { 
          client: true,
          buildings: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
          payments: { orderBy: { date: "asc" } },
          bills: { orderBy: { createdAt: "asc" }, include: { lines: { orderBy: { order: "asc" } } } },
          supplyLabourEntries: { orderBy: { date: "asc" } },
        }
      },
      lines: { 
        orderBy: { order: "asc" },
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
