import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatIndianNumber(num: number | string | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined || num === "") return "0";
  const val = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(val)) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
  }).format(val);
}

export function formatIndianString(val: string): string {
  if (!val) return "";
  const isNegative = val.startsWith("-");
  const cleanStr = val.replace(/[^0-9.]/g, "");
  if (!cleanStr) return isNegative ? "-" : "";

  const parts = cleanStr.split(".");
  const intPart = parts[0];
  const decPart = parts.length > 1 ? "." + parts[1].slice(0, 2) : "";

  if (!intPart) return (isNegative ? "-" : "") + (decPart ? "0" + decPart : "");

  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  const formattedInt = otherNumbers
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;

  return (isNegative ? "-" : "") + formattedInt + decPart;
}

export function parseIndianString(val: string): number {
  if (!val) return 0;
  const cleanStr = val.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    timeZone: "UTC"
  });
}

export function getFinancialYear(d: Date = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const month = date.getUTCMonth(); // 0 = Jan, 3 = April
  const year = date.getUTCFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = (startYear + 1).toString().slice(2);
  return `${startYear}-${endYearShort}`;
}

export function formatRefNo(num: number): string {
  return (num || 1).toString().padStart(2, "0");
}

export function formatInvoiceNo(num: number, date: Date = new Date()): string {
  const fy = getFinancialYear(date);
  return `${(num || 1).toString().padStart(3, "0")}/${fy}`;
}

