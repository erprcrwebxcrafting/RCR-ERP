import { cookies } from "next/headers";

export async function getFinancialYearDates() {
  const cookieStore = await cookies();
  const fyCookie = cookieStore.get("selected_fy")?.value || "current";

  const now = new Date();
  
  if (fyCookie === "all") {
    // Return a very wide date range for All Time
    return {
      startDate: new Date(2000, 0, 1),
      endDate: new Date(2100, 11, 31, 23, 59, 59, 999),
      isAllTime: true
    };
  }

  let startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;

  if (fyCookie !== "current" && !isNaN(parseInt(fyCookie))) {
    startYear = parseInt(fyCookie);
  }

  return {
    startDate: new Date(startYear, 3, 1), // April 1st
    endDate: new Date(startYear + 1, 2, 31, 23, 59, 59, 999), // March 31st of next year
    isAllTime: false
  };
}
