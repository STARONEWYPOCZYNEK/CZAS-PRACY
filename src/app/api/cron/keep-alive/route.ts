import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Wywoływane raz dziennie przez Vercel Cron. Jedyny cel: dowolne zapytanie do
 * bazy, żeby Supabase (darmowy plan) nie uśpił projektu po ~7 dniach braku
 * aktywności — dokładnie to spowodowało realną przerwę w logowaniu 2026-08-31.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("employees").select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pinged_at: new Date().toISOString() });
}
