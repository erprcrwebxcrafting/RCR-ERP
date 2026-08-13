const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanNames() {
  console.log("Cleaning site and building names in database...");

  const sites = await prisma.site.findMany();
  for (const s of sites) {
    let cleanName = s.projectName
      .replace(/\s*[\—\-]\s*\d+%\s*(Completed|Progress)?\s*(Project)?/gi, '')
      .replace(/\s*[\—\-]\s*Real Bill PDF.*$/gi, '')
      .replace(/\s*\(\s*\d+%\s*(Progress|Finished|Completed)?\s*\)/gi, '')
      .trim();

    if (cleanName !== s.projectName) {
      console.log(`Updating site "${s.projectName}" -> "${cleanName}"`);
      await prisma.site.update({
        where: { id: s.id },
        data: { projectName: cleanName }
      });
    }
  }

  const buildings = await prisma.building.findMany();
  for (const b of buildings) {
    let cleanName = b.name
      .replace(/\s*\(\s*\d+%\s*(Finished|Progress|Completed)?\s*\)/gi, '')
      .replace(/\s*\(\s*s\.pdf Format\s*\)/gi, '')
      .trim();

    if (cleanName !== b.name) {
      console.log(`Updating building "${b.name}" -> "${cleanName}"`);
      await prisma.building.update({
        where: { id: b.id },
        data: { name: cleanName }
      });
    }
  }

  console.log("Done cleaning names!");
}

cleanNames()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
