import { prisma } from "@/lib/prisma";
import { SiteForm } from "./site-form";

export default async function NewSitePage() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Site</h1>
        <p className="text-muted-foreground">Configure everything up front — buildings, work items, rates and labour categories.</p>
      </div>
      <SiteForm clients={clients} />
    </div>
  );
}
