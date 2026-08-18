"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    // NEXT_REDIRECT is thrown for successful redirects — must re-throw
    throw err;
  }
}
