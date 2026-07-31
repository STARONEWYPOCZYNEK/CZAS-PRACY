"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(email: string): Promise<{ error?: string; sent?: boolean }> {
  if (!email || !email.includes("@")) {
    return { error: "Podaj poprawny adres e-mail" };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || (await headers()).get("origin") || "";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: "Nie udało się wysłać linku logowania. Spróbuj ponownie." };
  }

  return { sent: true };
}
