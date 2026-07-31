import { NextResponse, type NextRequest } from "next/server";
import { clearEmployeeSession } from "@/lib/employee-session/cookie";

/**
 * Czyści cookie sesji pracownika i wraca do wyboru pracownika. Cookie nie da
 * się skasować bezpośrednio w Server Component (np. z redirectu w page.tsx),
 * stąd osobny route handler jako jedyne dozwolone miejsce do tego przy
 * przekierowaniu z page.tsx.
 */
export async function GET(request: NextRequest) {
  await clearEmployeeSession();
  return NextResponse.redirect(new URL("/pracownik", request.url));
}
