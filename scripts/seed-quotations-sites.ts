import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const generateRealisticSitesAndQuotations = async () => {
  console.log("Fetching existing clients...");
  const clients = await prisma.client.findMany();

  if (clients.length === 0) {
    console.error("No clients found. Please run the client seed script first.");
    return;
  }

  const projectNames = [
    "Skyline Towers - Phase 1",
    "Lodha Excelus RCC Work",
    "Metro Pillar Reinforcement - Line 3",
    "Godrej Infinity - Tower B",
    "Phoenix Mall Extension",
    "Rustomjee Crown - Podium Level",
    "DLF Cyber City - Block C",
    "Hiranandani Estate - Villa 5",
    "Prestige Tech Park - Phase 2",
    "Sobha City - Clubhouse",
    "Oberoi Realty - Commerz 3",
    "Brigade Gateway - Retail Block"
  ];

  const allWorkItemsTemplates = [
    { name: "Excavation in Soil", unit: "Cum", rate: 120 },
    { name: "PCC Work (1:4:8)", unit: "Cum", rate: 4500 },
    { name: "RCC Footing Concrete", unit: "Cum", rate: 5500 },
    { name: "RCC Column Concrete", unit: "Cum", rate: 6000 },
    { name: "RCC Beam & Slab Concrete", unit: "Cum", rate: 5800 },
    { name: "Mivan Shuttering", unit: "Sqm", rate: 450 },
    { name: "Conventional Shuttering (Footing)", unit: "Sqm", rate: 300 },
    { name: "Conventional Shuttering (Column)", unit: "Sqm", rate: 350 },
    { name: "Conventional Shuttering (Slab)", unit: "Sqm", rate: 320 },
    { name: "Steel Reinforcement - TMT 8mm", unit: "Kg", rate: 6.5 },
    { name: "Steel Reinforcement - TMT 10mm-12mm", unit: "Kg", rate: 6.0 },
    { name: "Steel Reinforcement - TMT 16mm+", unit: "Kg", rate: 5.5 },
    { name: "Brickwork (9 inch)", unit: "Sft", rate: 35 },
    { name: "Brickwork (4.5 inch)", unit: "Sft", rate: 25 },
    { name: "Block Masonry", unit: "Sqm", rate: 320 },
    { name: "Plastering (Internal)", unit: "Sqm", rate: 180 },
    { name: "Plastering (External)", unit: "Sqm", rate: 220 },
    { name: "Waterproofing (Terrace)", unit: "Sft", rate: 45 },
    { name: "Waterproofing (Washroom)", unit: "Sft", rate: 35 },
    { name: "Flooring - Vitrified Tiles", unit: "Sft", rate: 65 },
    { name: "Flooring - Granite", unit: "Sft", rate: 120 },
    { name: "Painting (Internal - Primer)", unit: "Sft", rate: 12 },
    { name: "Painting (Internal - Emulsion)", unit: "Sft", rate: 18 },
    { name: "Painting (External - Weathercoat)", unit: "Sft", rate: 22 }
  ];

  const labourCategoriesTemplates = [
    { name: "Fitter", dailyWage: 1100, overtimeRate: 137.5 },
    { name: "Helper", dailyWage: 800, overtimeRate: 100 },
    { name: "Carpenter", dailyWage: 1200, overtimeRate: 150 },
    { name: "Mason", dailyWage: 1150, overtimeRate: 143.75 },
    { name: "Electrician", dailyWage: 1000, overtimeRate: 125 },
    { name: "Plumber", dailyWage: 1050, overtimeRate: 131.25 }
  ];

  const terms = [
    "1. Our contract will be purely on labour basis i.e all materials including conventional & Mivan shuttering material, all machineries required for work shall be supplied by Client.",
    "2. Establishing & setting survey points as & when require in client's scope.",
    "3. Safety equipment like safety belts, helmets, shoes etc. will be provided by client.",
    "4. Payment terms: 15 days from the date of submission of RA Bill."
  ];

  const exclusions = [
    "1) Handling of any local issues incl. Corporator, local politician, MCGM, Police etc.",
    "2) Co-ordination with Architects & Consultants.",
    "3) Any kind of site / outside laboratory function."
  ];

  let createdCount = 0;

  for (let i = 0; i < 10; i++) {
    const client = clients[i % clients.length];
    const projectName = projectNames[i];

    // Determine how many items this project should have (Some small, some large 18-20)
    const numItems = i % 3 === 0 ? 20 : (i % 2 === 0 ? 12 : 5);
    // Shuffle allWorkItemsTemplates to make them random for each project
    const shuffledItems = [...allWorkItemsTemplates].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, numItems);

    // Randomize Taxes and Deductions for realism
    const taxProfiles = [
      { cgst: 9, sgst: 9, tds: 1, retention: 5 },
      { cgst: 9, sgst: 9, tds: 2, retention: 2 },
      { cgst: 6, sgst: 6, tds: 1, retention: 5 },
      { cgst: 0, sgst: 0, tds: 0.1, retention: 10 },
      { cgst: 9, sgst: 9, tds: 2, retention: 10 }
    ];
    const tax = taxProfiles[i % taxProfiles.length];

    // Varied Subjects
    const subjects = [
      `Quotation for Civil & RCC Work - ${projectName}`,
      `Proposal for Shuttering & Reinforcement - ${projectName}`,
      `Estimate for Finishing Works at ${projectName}`,
      `Labour Contract for Earthwork and PCC - ${projectName}`,
      `Waterproofing & Tiling Works Quotation - ${projectName}`
    ];
    const subject = subjects[i % subjects.length];

    // Varied Terms
    const termVariations = [
      terms,
      [
        "1. Material supplied by client. Only labour rate quoted.",
        "2. RA bills to be cleared within 7 days.",
        "3. Scaffolding is in client's scope."
      ],
      [
        "1. Work to be completed as per architect drawings.",
        "2. 5% retention will be deducted from every RA bill.",
        "3. Electricity and water to be provided free of cost at site."
      ]
    ];

    // Create Quotation
    const quotation = await prisma.quotation.create({
      data: {
        clientId: client.id,
        projectName: projectName,
        quotationNo: `RCR/QT/2026-27/${(i + 1).toString().padStart(3, '0')}`,
        date: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
        subject: subject,
        termsJson: JSON.stringify(termVariations[i % termVariations.length].join("\n")),
        exclusionsJson: JSON.stringify(exclusions.join("\n")),
        itemsJson: JSON.stringify(
          selectedItems.map(item => ({ description: item.name, unit: item.unit, rate: item.rate }))
        ),
        status: "APPROVED"
      }
    });

    // Create Site linked to client
    const site = await prisma.site.create({
      data: {
        clientId: client.id,
        projectName: projectName,
        address: `${client.address ? client.address + ', ' : ''}Project Site, India`,
        gstNo: client.gstNo || "27ABCDE1234F1Z5",
        retentionPct: tax.retention,
        cgstPct: tax.cgst,
        sgstPct: tax.sgst,
        tdsPct: tax.tds,
        workOrderNo: `WO/${projectName.substring(0, 3).toUpperCase()}/2026-27/${(i + 1).toString().padStart(3, '0')}`,
        remarks: "Approved as per quotation. Taxes & deductions applied.",
        active: true
      }
    });

    // Link Quotation to Site
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { siteId: site.id }
    });

    // Add Buildings to Site
    const buildings = [];
    const numBuildings = i % 2 === 0 ? 2 : 1;
    for (let b = 1; b <= numBuildings; b++) {
      const building = await prisma.building.create({
        data: {
          siteId: site.id,
          name: `Tower ${String.fromCharCode(64 + b)}`,
          order: b
        }
      });
      buildings.push(building);
    }

    // Add Work Items to Site (linked to buildings or general)
    let orderCounter = 1;
    for (const building of buildings) {
      for (const item of selectedItems) {
        // Vary the rate slightly for realism across different sites (e.g. +- 10%)
        const randomModifier = (Math.random() * 0.2) + 0.9; // 0.9 to 1.1
        await prisma.workItem.create({
          data: {
            siteId: site.id,
            buildingId: building.id,
            name: item.name,
            unit: item.unit,
            rate: Math.round(item.rate * randomModifier),
            buWork: Math.floor(Math.random() * 5000) + 500, // Random Approx Qty
            order: orderCounter++
          }
        });
      }
    }

    // Add Labour Categories to Site
    for (let c = 0; c < labourCategoriesTemplates.length; c++) {
      const cat = labourCategoriesTemplates[c];
      // Vary the wage slightly for realism (e.g. +- 50 rs)
      const wageModifier = Math.floor(Math.random() * 3) * 50 - 50; // -50, 0, or +50
      const newWage = cat.dailyWage + wageModifier;
      await prisma.labourCategory.create({
        data: {
          siteId: site.id,
          name: cat.name,
          dailyWage: newWage,
          overtimeRate: newWage / 8, // Standard 8 hr shift calculation
          order: c + 1
        }
      });
    }

    console.log(`Created Quotation and Site for project: ${projectName}`);
    createdCount++;
  }

  console.log(`\nSuccessfully created ${createdCount} Quotations and corresponding Sites!`);
};

generateRealisticSitesAndQuotations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
