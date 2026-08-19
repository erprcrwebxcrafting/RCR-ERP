"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateGlobalSettings(formData: FormData) {
  try {
    const companyName = (formData.get("companyName") as string || "").trim();
    const phone = (formData.get("phone") as string || "").trim();
    const email = (formData.get("email") as string || "").trim();
    const website = (formData.get("website") as string || "").trim();
    const address = (formData.get("address") as string || "").trim();

    const notifySupervisorLogins = formData.get("notifySupervisorLogins") === "on";

    if (!companyName || companyName.length < 2) {
      throw new Error("Company name is required (minimum 2 characters).");
    }

    if (phone) {
      const cleanedPhone = phone.replace(/\s+/g, "").replace(/^(\+91|91)/, "");
      if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
        throw new Error("Please enter a valid 10-digit Indian mobile number.");
      }
    }

    await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: {
        companyName: companyName || "RCR ENTERPRISES",
        phone,
        email,
        website,
        address,
        notifySupervisorLogins,
      },
      create: {
        id: "global",
        companyName: companyName || "RCR ENTERPRISES",
        phone,
        email,
        website,
        address,
        notifySupervisorLogins,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return { error: error.message };
  }
}
