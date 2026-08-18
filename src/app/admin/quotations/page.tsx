import { prisma } from "@/lib/prisma";
// TS Re-check trigger
import Link from "next/link";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, FileText, Search, ExternalLink } from "lucide-react";
import { QuotationSendButtons } from "../sites/[id]/quotations/send-buttons";
import { deleteQuotationAction } from "./actions";
import { getFinancialYearDates } from "@/lib/get-fy";
import { Pagination } from "@/components/ui/pagination";

export default async function AllQuotationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await searchParams;
  const { startDate, endDate } = await getFinancialYearDates();
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const PAGE_SIZE = 10;

  const whereClause = { createdAt: { gte: startDate, lte: endDate } };

  const [totalQuotations, quotations] = await Promise.all([
    prisma.quotation.count({ where: whereClause }),
    prisma.quotation.findMany({
      where: whereClause,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { site: { include: { client: true } }, client: true },
      orderBy: { createdAt: "desc" },
    })
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/20">
            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Quotations Central</h1>
            <p className="text-muted-foreground mt-1">Manage all your prospect and client quotations in one place.</p>
          </div>
        </div>
        <Link href="/admin/quotations/new">
          <Button size="lg" className="gap-2 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 rounded-full px-6">
            <Plus className="h-5 w-5" /> Create New Quotation
          </Button>
        </Link>
      </div>

      <Card className="border-t-4 border-t-indigo-500 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead className="bg-muted/50">
              <TR>
                <TH className="py-4 font-semibold text-muted-foreground">Quotation No.</TH>
                <TH className="py-4 font-semibold text-muted-foreground">Site / Project</TH>
                <TH className="py-4 font-semibold text-muted-foreground">Client Name</TH>
                <TH className="py-4 font-semibold text-muted-foreground">Generated On</TH>
                <TH className="py-4 font-semibold text-muted-foreground">Status</TH>
                <TH className="py-4 font-semibold text-muted-foreground text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {quotations.map((q: any) => (
                <TR key={q.id} className="group hover:bg-muted/30 transition-colors">
                  <TD className="font-bold text-foreground py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {q.quotationNo}
                    </div>
                  </TD>
                  <TD className="py-4 font-medium">{q.projectName || q.site?.projectName}</TD>
                  <TD className="py-4">{q.client?.name || q.site?.client?.name}</TD>
                  <TD className="py-4 text-muted-foreground">{formatDate(q.date)}</TD>
                  <TD className="py-4">
                    <Badge variant={q.status === 'SENT' ? 'default' : 'secondary'} className={q.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200'}>
                      {q.status}
                    </Badge>
                  </TD>
                  <TD className="py-4">
                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      {q.status === "DRAFT" && (
                        <Link href={`/admin/quotations/${q.id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 font-medium hover:bg-indigo-50 hover:text-indigo-600 border-indigo-200 text-indigo-600">
                            Edit
                          </Button>
                        </Link>
                      )}
                      <a href={`/api/quotations/${q.id}/pdf`} target="_blank">
                        <Button variant="outline" size="sm" className="h-8 gap-1 font-medium">
                          <ExternalLink className="h-3 w-3" /> PDF
                        </Button>
                      </a>
                      <div className="w-px h-6 bg-border mx-1"></div>
                      <QuotationSendButtons 
                        quotationId={q.id} 
                        clientId={q.clientId || q.site?.clientId || ""}
                        clientEmail={q.client?.email || q.site?.client?.email || ""}
                        clientPhone={q.client?.phone || q.site?.client?.phone || ""}
                      />
                      <form action={deleteQuotationAction.bind(null, q.id)}>
                        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TD>
                </TR>
              ))}
              {quotations.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-16">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-4 bg-muted/50 rounded-full">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">No Quotations Found</h3>
                      <p className="text-muted-foreground max-w-sm">You haven't created any quotations yet. Click the "Create New Quotation" button above to get started.</p>
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>
      </Card>
      
      <Pagination 
        currentPage={page} 
        totalPages={Math.ceil(totalQuotations / PAGE_SIZE)} 
        totalItems={totalQuotations} 
        pageSize={PAGE_SIZE} 
      />
    </div>
  );
}
