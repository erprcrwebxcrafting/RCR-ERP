import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { QuotationForm } from "../../new/quotation-form";
import { updateQuotationAction } from "../../actions";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const quotation = await prisma.quotation.findUnique({
    where: { id },
  });
  
  if (!quotation) notFound();
  
  if (quotation.status !== "DRAFT") {
    // If it's already sent, prevent editing
    redirect("/admin/quotations");
  }

  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  // Parse items from JSON
  let items = [];
  try {
    items = JSON.parse(quotation.itemsJson);
  } catch (e) {
    items = [{ description: "", unit: "Sft", rate: "" }];
  }

  // Parse terms from JSON back into newline-separated string
  let termsStr = "";
  try {
    termsStr = JSON.parse(quotation.termsJson).join("\n");
  } catch (e) {
    termsStr = quotation.termsJson;
  }

  // Parse exclusions from JSON back into newline-separated string
  let exclusionsStr = "";
  try {
    if (quotation.exclusionsJson) {
      exclusionsStr = JSON.parse(quotation.exclusionsJson).join("\n");
    }
  } catch (e) {
    exclusionsStr = quotation.exclusionsJson || "";
  }

  const initialData = {
    clientId: quotation.clientId,
    projectName: quotation.projectName,
    subject: quotation.subject,
    items,
    terms: termsStr,
    exclusions: exclusionsStr,
  };

  const updateAction = updateQuotationAction.bind(null, id);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Quotation: {quotation.quotationNo}</h1>
        <p className="text-muted-foreground">Modify the details of this draft quotation.</p>
      </div>
      <QuotationForm 
        clients={clients} 
        defaultTerms="" 
        defaultExclusions=""
        action={updateAction}
        initialData={initialData}
      />
    </div>
  );
}
