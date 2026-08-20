import { prisma } from "@/lib/prisma";
import { ReportsDashboard } from "./reports-dashboard";
import { fetchReportsDataAction } from "./actions";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const resolvedParams = await searchParams;
  const range = resolvedParams.range || "1d";

  // Fetch the basic sites list for the dropdown
  const sites = await prisma.site.findMany({
    select: {
      id: true,
      projectName: true,
      client: { select: { name: true } }
    },
    orderBy: { projectName: "asc" },
  });

  // Fetch the aggregated data for the initial render
  const initialData = await fetchReportsDataAction(range, "all");

  return (
    <Suspense fallback={<div className="flex h-[400px] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <ReportsDashboard
        initialRange={range}
        sites={JSON.parse(JSON.stringify(sites))}
        initialData={initialData}
      />
    </Suspense>
  );
}
