/**
 * Standard Form Validation Utilities for Construction ERP
 */

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const AADHAR_REGEX = /^\d{12}$/;
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(phone?: string | null): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) return { valid: true }; // optional
  let cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }
  if (!INDIAN_PHONE_REGEX.test(cleaned)) {
    return { valid: false, error: "Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)." };
  }
  return { valid: true };
}

export function validateAadhar(aadhar?: string | null): { valid: boolean; error?: string } {
  if (!aadhar || !aadhar.trim()) return { valid: true }; // optional
  const cleaned = aadhar.replace(/[\s-]+/g, "");
  if (!AADHAR_REGEX.test(cleaned)) {
    return { valid: false, error: "Aadhar card number must be exactly 12 digits." };
  }
  return { valid: true };
}

export function validateGST(gst?: string | null): { valid: boolean; error?: string } {
  if (!gst || !gst.trim()) return { valid: true }; // optional
  const cleaned = gst.trim().toUpperCase();
  if (!GST_REGEX.test(cleaned)) {
    return { valid: false, error: "Invalid GST number format (e.g. 27AAAAA0000A1Z5)." };
  }
  return { valid: true };
}

export function validateIFSC(ifsc?: string | null): { valid: boolean; error?: string } {
  if (!ifsc || !ifsc.trim()) return { valid: true }; // optional
  const cleaned = ifsc.trim().toUpperCase();
  if (!IFSC_REGEX.test(cleaned)) {
    return { valid: false, error: "Invalid IFSC Code format (11 characters, 5th character must be 0, e.g. ICIC0000884)." };
  }
  return { valid: true };
}

export function validateEmail(email?: string | null, required: boolean = false): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    if (required) return { valid: false, error: "Email address is required." };
    return { valid: true };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true };
}

export function validatePositiveNumber(val: number | string | undefined | null, fieldName: string, allowZero: boolean = false): { valid: boolean; error?: string } {
  const num = typeof val === "string" ? parseFloat(val) : Number(val);
  if (isNaN(num)) {
    return { valid: false, error: `Please enter a valid number for ${fieldName}.` };
  }
  if (allowZero ? num < 0 : num <= 0) {
    return { valid: false, error: `${fieldName} must be ${allowZero ? "greater than or equal to 0" : "greater than 0"}.` };
  }
  return { valid: true };
}
