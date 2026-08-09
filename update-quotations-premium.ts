import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const premiumTerms = `**A] SCOPE OF WORK & GENERAL CONDITIONS**
1) The contract shall be executed purely on a labour basis. All materials, including conventional & Mivan shuttering material, and all machinery required for the work, shall be supplied by the Client.
2) Establishing and setting survey points, as and when required, falls under the Client's scope.
3) Provision of adequate space for labour hutments, including electricity, water supply with distribution, labour toilets, and drinking water, is in the Client's scope.
4) Standard working hours are considered from 8:00 AM to 8:00 PM. This may be extended up to 10:00 PM if site conditions demand.
5) An idling period of a maximum of 3 days is considered. Any idling beyond this period shall be reimbursed and paid on a mutually agreed basis.
6) All Good for Construction (GFC) drawings for ground floor slabs must be provided at least one week in advance.
7) All necessary safety materials and PPE shall be supplied by the Client.
8) Work on Sundays and public holidays shall be carried out strictly as per written instructions from the Client.

**B] EXCLUSIONS**
1) Handling of local issues, including coordination with corporators, local politicians, MCGM (Officer, Clean-Up & Health), Police (Beat & Traffic), and liaising with government departments.
2) Coordination with Architects and Consultants.
3) Any kind of on-site or off-site laboratory testing functions.

**C] MODE OF MEASUREMENT**
- Outer Side Slab Measurement: 100%
- Elevation, OHWT, LMR: 100%
- Balcony, Exposed Slabs, Duct Area: 100%
- Flower Bed & Service Duct: 100%
- Staircase & Lift Shaft: 100%
- Floor-to-Floor Height (Up to 3.1m): 100%
- Floor-to-Floor Height (3.1m to 4.5m): 150%
- Floor-to-Floor Height (Above 4.5m): 200%
- Terrace Floor & Refuge Floor: 100%
- Loft Area: 100%
- Parking Tower Behind Lift (As per Drawing): 100%
- Other Parking Towers: 100%

**D] PAYMENT TERMS**
1) Validity: This quotation is valid for 30 days from the date of issue.
2) Mobilization Period: A minimum of 7 to 8 days is required for labour mobilization from the date of issue of the LOI/Work Order.
3) Mobilization Advance: An advance of Rs. 5,00,000/- is to be paid along with the order. This amount will be recovered at a rate of 10% from each running bill.
4) Taxes: GST shall be charged extra as applicable.
5) Billing Cycle: Running bills shall be raised monthly. 75% of the payment must be released within 7 days of bill submission, and the balance 25% within 10 days.
6) Extra Work: Any additional work will be executed only after obtaining written rate approval from the Client.
7) Termination: In the event the contract is terminated by the Client, payment for the work executed till date must be released within 7 days.
8) Disbursement: "Kharchi" (allowance) should be disbursed to each fitter on the 25th of the month, and full monthly settlement on the 10th of every month, subject to Clause 11.
9) Progress Payment: Monthly payments shall be released as per actual steel progress irrespective of slab casting (Considered 40% for column fixing and 60% for slab and beams).
10) Retention: Retention money will be deducted up to a maximum limit of Rs. 1,00,000 (2%). Any retention amount beyond this limit must be released.
11) Debit Notes: No debit notes will be considered valid without authorized signature on the debit challan.
12) Departmental Labour Rates (8-hour basis):
- Carpenter: Rs. 1,100/-
- Fitter: Rs. 1,100/-
- Mason: Rs. 1,100/-
- Helper: Rs. 800/-`;

async function main() {
  const t = premiumTerms.split("\n").map(x => x.trimEnd());
  await prisma.quotation.updateMany({
    data: { termsJson: JSON.stringify(t), exclusionsJson: JSON.stringify([]) }
  });
  console.log("Updated terms for all quotations with Premium Text");
}
main();
