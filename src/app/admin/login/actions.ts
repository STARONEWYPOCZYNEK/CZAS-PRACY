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
      emailRedirectTo: `${origin}/admin/login/confirm`,
    },
  });

  if (error) {
    if (error.status === 429) {
      return {
        error:
          "Zbyt wiele prób logowania w krótkim czasie (limit wysyłki e-maili). Spróbuj ponownie za około godzinę.",
      };
    }
    return { error: "Nie udało się wysłać linku logowania. Spróbuj ponownie." };
  }

  return { sent: true };
}
