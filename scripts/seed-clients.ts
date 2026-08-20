import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clients = [
  { name: "Larsen & Toubro Ltd", contactPerson: "Rajesh Kumar", phone: "9876543210", email: "procurement@larsentoubro.com", gstNo: "27AAACL0140P1Z1", address: "L&T House, Ballard Estate, Mumbai, Maharashtra 400001", remarks: "Premium client, Tier 1" },
  { name: "Shapoorji Pallonji Co.", contactPerson: "Amit Deshmukh", phone: "8765432109", email: "vendor.relations@shapoorji.com", gstNo: "27AAACS1392C1Z4", address: "SP Centre, 41/44, Minoo Desai Marg, Colaba, Mumbai 400005", remarks: "Heavy infrastructure projects" },
  { name: "Tata Projects", contactPerson: "Suresh Pillai", phone: "7654321098", email: "info@tataprojects.com", gstNo: "36AAACT8289D1Z4", address: "Mithona Towers, 1-7-80 to 87, Prenderghast Road, Secunderabad 500003", remarks: "Strict compliance requirements" },
  { name: "Reliance Infrastructure", contactPerson: "Priya Sharma", phone: "9123456780", email: "infra@relianceada.com", gstNo: "27AAACR1643C1Z8", address: "Reliance Centre, Santacruz East, Mumbai 400055", remarks: "Requires weekly progress reports" },
  { name: "GMR Group", contactPerson: "Manoj Singh", phone: "8123456709", email: "projects@gmrgroup.in", gstNo: "07AAACG1565C1Z3", address: "GMR AeroCity, New Delhi 110037", remarks: "Airport and highway works" },
  { name: "Hindustan Construction Co.", contactPerson: "Anil Kapoor", phone: "9234567801", email: "contracts@hccindia.com", gstNo: "27AAACH0184A1Z7", address: "Hincon House, LBS Marg, Vikhroli (W), Mumbai 400083", remarks: "Water and tunnel works" },
  { name: "Afcons Infrastructure", contactPerson: "Vikram Mehta", phone: "8234567019", email: "sourcing@afcons.com", gstNo: "27AAACA1916F1Z3", address: "Afcons House, 16 Shah Industrial Estate, Veera Desai Road, Mumbai 400053", remarks: "Marine and bridge works" },
  { name: "Gammon India", contactPerson: "Sanjay Patel", phone: "9345678012", email: "procurement@gammonindia.com", gstNo: "27AAACG0479A1Z9", address: "Gammon House, Veer Savarkar Marg, Prabhadevi, Mumbai 400025", remarks: "Civil engineering" },
  { name: "Nagarjuna Construction", contactPerson: "Rahul Reddy", phone: "8345670129", email: "ncc@nccltd.in", gstNo: "36AAACN4169M1Z5", address: "NCC House, Madhapur, Hyderabad 500081", remarks: "Housing and urban infra" },
  { name: "Simplex Infrastructures", contactPerson: "Neha Gupta", phone: "9456780123", email: "vendors@simplexinfra.com", gstNo: "19AAACS8353A1Z8", address: "Simplex House, 27 Shakespeare Sarani, Kolkata 700017", remarks: "Industrial plants" },
  { name: "Dilip Buildcon", contactPerson: "Rohan Jain", phone: "8456701239", email: "info@dilipbuildcon.com", gstNo: "23AAACD3400L1Z7", address: "Plot No. 5, Inside Govind Narayan Singh Gate, Chuna Bhatti, Bhopal 462016", remarks: "Roads and highways" },
  { name: "JMC Projects", contactPerson: "Arvind Joshi", phone: "9567801234", email: "contracts@jmcprojects.com", gstNo: "24AAACJ1353F1Z6", address: "Kalpataru Synergy, Opp. Grand Hyatt, Santacruz (E), Mumbai 400055", remarks: "Commercial buildings" },
  { name: "ITD Cementation", contactPerson: "Deepak Kumar", phone: "8567012349", email: "admin@itdcem.co.in", gstNo: "27AAACI1607C1Z6", address: "National Plastic Building, Subhash Road, Vile Parle (E), Mumbai 400057", remarks: "Maritime structures" },
  { name: "Ahluwalia Contracts", contactPerson: "Pooja Verma", phone: "9678012345", email: "projects@acilnet.com", gstNo: "07AAACA2394F1Z1", address: "A-177, Okhla Industrial Area, Phase-I, New Delhi 110020", remarks: "Hospitals and institutions" },
  { name: "Jindal Steel & Power", contactPerson: "Manish Agarwal", phone: "8670123459", email: "infra@jindalsteel.com", gstNo: "06AAACJ4321E1Z3", address: "O.P. Jindal Marg, Hisar, Haryana 125005", remarks: "Structural steel supplier and infra partner" }
];

async function main() {
  console.log("Seeding 15 clients...");
  for (const client of clients) {
    await prisma.client.create({
      data: client
    });
  }
  console.log("Clients seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
