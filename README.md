# RCR Enterprises — Construction ERP

A production-oriented Construction ERP built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma, Auth.js, pdf-lib and ExcelJS — modeled directly on your real Quotation PDF and Running Bill Excel formats.

## What's included (working, end-to-end)

- **Role-based auth** (Admin / Supervisor) via Auth.js credentials + middleware route protection
- **Clients → Sites → Buildings** — fully relational, unlimited of each
- **Dynamic Work Items & Rates** per site (no hardcoded slab lists — add/remove freely)
- **Dynamic Labour Categories** per site (Fitter, Helper, Carpenter, Mason, or anything else)
- **Supervisor assignment** — single-site auto-redirect, multi-site "My Sites" picker
- **Attendance entry** (Supervisor) — Present/Absent/Half Day + overtime hours, one row per labourer per day
- **Quotation generator** — produces a PDF replicating your RCR Enterprises quotation layout (letterhead, rate schedule, terms, exclusions, signatures), pre-filled with your standard terms
- **Running Bill generator** — enter this month's quantities per building/work item, and the system:
  - Pulls **previous/cumulative** figures automatically from the last bill in the database
  - Generates a full **.xlsx package** replicating your uploaded template exactly: Tax Invoice, Running Bill Summary, one detail sheet per Building, Labour Supply (from attendance), and Balance Sheet (from payments)
- **Payments ledger** per site, feeding the Balance Sheet
- **Labour Payment calculation & approval** — pick a period on any Site's "Labour Payment" tab; the system sums attendance (Present = 1 day, Half Day = 0.5) × daily wage + overtime hours × overtime rate per labourer, and Admin approves each entry
- **Dashboard bar chart** (Recharts) — billed amount by site, computed live
- **Dashboard & Reports** — live figures computed from the database (attendance, labour payment totals, billed vs. paid, outstanding)
- **Dark, premium Tailwind UI** with cards, tables, tabs, badges

## What's stubbed / next phase

These are noted in-app rather than silently missing:
- **WhatsApp / Email sending** of the bill package (download works now; wiring to SMTP + WhatsApp Cloud API is Phase 4)
- **Audit log viewer** (writes are modeled; a viewer UI is not yet built)
- **Documents tab** on Site detail (file upload/storage not yet wired — would need S3/Cloudinary)

None of this is hard — the data model and folder structure were built to support all of it without restructuring.

## Getting started

```bash
npm install
cp .env.example .env
# .env already points at a local SQLite file, so this works with zero extra setup

npx prisma db push       # creates dev.db and all tables
npm run db:seed          # creates an admin user, a supervisor, and a demo client/site
npm run dev
```

Open http://localhost:3000

**Demo logins (created by the seed script):**
| Role | Email | Password |
|---|---|---|
| Admin | admin@rcrenterprises.com | admin123 |
| Supervisor | rahul@rcrenterprises.com | supervisor123 |

Change these immediately if you deploy this anywhere beyond your own machine.

## Switching to PostgreSQL

SQLite is the default so the project runs instantly with no external services. To move to Postgres (recommended before production use, since SQLite doesn't handle concurrent writes well):

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
2. In `.env`, set `DATABASE_URL="postgresql://user:password@host:5432/dbname"`
3. Run `npx prisma db push` again (or `npx prisma migrate dev` to start using migrations)

## Project structure

```
src/
  app/
    login/                     Login page + server action
    admin/                     Admin panel (role-protected by middleware)
      clients/                 Client CRUD
      sites/                   Site CRUD, and per-site detail with tabs
        [id]/
          bills/new             Running Bill generation form
          bills/[billId]        Running Bill summary + Excel download
          quotations/new        Quotation builder
      supervisors/              Supervisor account creation
      attendance/ bills/ quotations/ reports/ settings/   Cross-site list views
    supervisor/                 Supervisor panel (role-protected)
      sites/ attendance/ labours/ profile/
    api/
      auth/[...nextauth]/       Auth.js route handler
      quotations/[id]/pdf/      Quotation PDF endpoint
      bills/[id]/excel/         Running Bill Excel package endpoint
  lib/
    pdf/quotation.ts            PDF generator (pdf-lib)
    excel/runningBill.ts        Excel generator (ExcelJS) — mirrors your uploaded workbook sheet-for-sheet
    prisma.ts, utils.ts
  components/ui/                Hand-built shadcn-style primitives (button, input, card, table, badge, label)
prisma/
  schema.prisma                 Full data model
  seed.ts                       Demo data based on your real Sshivaay Constructions project
```

## Design notes / decisions made for you

- **Buildings and Work Items are fully dynamic** — nothing about slab numbers, building names, or labour categories is hardcoded anywhere in the code. They're all rows in the database that you configure per site.
- **"Previous" quantities/amounts are computed, not entered** — when you generate a new Running Bill, the system looks up the previous bill's cumulative figures for each (building, work item) pair automatically, exactly as your spec required ("the database is always the single source of truth").
- **The Excel package structure matches your uploaded workbook** sheet-for-sheet: Tax Invoice → Running Bill Summary → one sheet per Building → Labour Supply → Balance Sheet.
- Company bank details (A/C, IFSC) and GST number are currently hardcoded in the two generator routes (`src/app/api/quotations/[id]/pdf/route.ts` and `src/app/api/bills/[id]/excel/route.ts`) — move these into a `Settings` table when you're ready to make them editable in the UI rather than in code.

## A note on scope

This is a real, working foundation — not a mockup. Every button in the modules listed under "What's included" is wired to an actual Server Action and actual database writes; nothing is placeholder data. The items under "What's stubbed" are flagged deliberately rather than faked, so you know exactly what's left before this goes in front of a client.
