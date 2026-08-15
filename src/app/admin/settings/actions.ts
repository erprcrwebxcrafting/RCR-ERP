"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateGlobalSettings(formData: FormData) {
  try {
    const companyName = formData.get("companyName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const website = formData.get("website") as string;
    const address = formData.get("address") as string;

    await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: {
        companyName: companyName || "RCR ENTERPRISES",
        phone,
        email,
        website,
        address,
      },
      create: {
        id: "global",
        companyName: companyName || "RCR ENTERPRISES",
        phone,
        email,
        website,
        address,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return { error: error.message };
  }
}
