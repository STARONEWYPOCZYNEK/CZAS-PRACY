import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const redirectTo = request.nextUrl.searchParams.get("next") || "/admin";

  const supabase = await createClient();

  if (tokenHash && type) {
    // Weryfikacja przez token_hash — działa niezależnie od tego, w jakiej
    // przeglądarce/aplikacji (np. wbudowana przeglądarka appki Mail na telefonie)
    // otwarto link z maila, w przeciwieństwie do PKCE (exchangeCodeForSession),
    // które wymaga tej samej przeglądarki co przy wysyłce linku.
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  } else if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
