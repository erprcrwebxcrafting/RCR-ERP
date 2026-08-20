import { execSync } from "child_process";

const runScript = (scriptName: string) => {
  console.log(`\n======================================================`);
  console.log(`Executing: ${scriptName}`);
  console.log(`======================================================\n`);
  try {
    execSync(`npx tsx scripts/seed/${scriptName}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\nFailed executing ${scriptName}. Halting process.`);
    process.exit(1);
  }
};

const seedAll = () => {
  console.log("\n🚀 Starting Ultimate Chronological Seeding Pipeline...");
  
  runScript("01-backdate-sites.ts");
  runScript("02-seed-supervisors.ts");
  runScript("03-seed-labours.ts");
  runScript("04-seed-attendance.ts");
  runScript("05-seed-progress-expenses.ts");
  runScript("06-seed-bills-payments.ts");
  
  console.log("\n🎉 Ultimate Seeding Pipeline Completed Successfully! The ERP is now fully populated with realistic historical data.");
};

seedAll();
