import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuotationForm } from "./quotation-form";

const DEFAULT_TERMS = `**A]**
1) Our contract will be purely on labour basis i.e all materials including conventional & Mivan shuttering material, all machineries required for work shall be supplied by Client.
2) Establishing & setting survey points as & when require in client's scope.
3) Proper space for labour hutments including electricity & water supply with distribution & labour toilets & drinking water in client's scope.
4) We have considered the working time from 8.00 AM to 8.00 PM, it may be extended upto 10 PM, if situation demand.
5) We consider idling period for 3 days only, beyond that you have to reimburse & to be paid on mutually agreed basis.
6) All GFC drawings for grd floors slab received in one week advance.
7) All safety material shall be supplied by the client.
8) "Work on Sundays & Holidays shall be carried out only as per written instruction from client."

**B) MODE OF MEASUREMENT**
- Outer Side Slab Measurement: 100%
- Elevation, OHWT, LMR: 100%
- Balcony, Exposed slabs, duct area: 100%
- Flower Bed & Service Duct: 100%
- Staircase & Lift Shaft: 100%
- Floor to floor Height upto 3.1m: 100% if it is 3 to 4.5m: 150%, Above 4.5m: 200%
- Terrace Floor: 100%
- Refuge Floor: 100%
- Loft Area: 100%
- Parking Tower Behind Lift as per Drawing: 100%
- Other Parking Tower 100%.

**C] Payment Terms :**
1. Validity - Our quotation is valid for 30 days.
2. Mobilization period - We require minimum 7-8 days labour mobilization period from date of issue of LOI / work order.
3. Mobilization Advance - Rs. 500000/- to be paid along with order & which will be recovered 10% in each bill
4. "GST shall be charged extra as applicable."
5. "Running bills shall be raised monthly. 75% payment to be released within 7 days of bill submission and balance 25% within 10 days."
6. Any extra work will be done after getting rate approval from Client only.
7. "In case the contract is terminated by the client, payment for the work executed till date shall be released within 7 days."
8. Above kharchi amount should be given to each fitter at 25th and full monthly payment at 10th of every month as per sr. no. 11 condition.
9. Every month payment should be given as per actual steel progress irrespective of slab casting. Considered 40% for column fixing and 60% for slab and beam.
10. Retention will be reduced up to Rs 1 lakh, after Rs 1 lakh the retention will have to be released. 2%
11. Any type of debit will not be valid without my signature on the debit challan.
12. Supply of labour in departmental work rates for 8 hourly basis as below;
i) Carpenter @ Rs.1100/- ii) Fitter @ Rs.1100/- iii) Helper @ Rs.800/- iv) Mason @ Rs.1100/-`;

const DEFAULT_EXCLUSIONS = `1) Handling of any local issues incl. Corporator, local politician, MCGM (Officer, Clean-Up & Health), Police incl. Bit & traffic, Laisoning with Govt. dept.etc
2) Co-ordination with Architects & Consultants.
3) Any kind of site / outside laboratory function.`;

export default async function NewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id: id },
    include: { client: true, workItems: { orderBy: { order: "asc" } } },
  });
  if (!site) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Quotation</h1>
        <p className="text-muted-foreground">{site.projectName} · {site.client.name}</p>
      </div>
      <QuotationForm siteId={site.id} workItems={site.workItems} defaultTerms={DEFAULT_TERMS} defaultExclusions={DEFAULT_EXCLUSIONS} />
    </div>
  );
}
