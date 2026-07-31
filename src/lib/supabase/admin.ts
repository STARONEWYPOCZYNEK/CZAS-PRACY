import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Klient z rolą serwisową — omija RLS. Używany WYŁĄCZNIE po stronie serwera
 * dla przepływu pracownika (bez konta Supabase Auth): weryfikacja PIN-u,
 * zapis/odczyt/edycja własnych wpisów czasu pracy po zweryfikowaniu podpisanego cookie.
 * Nigdy nie importować w komponencie klienckim.
 * Celowo bez `import "server-only"` — ten pakiet rzuca wyjątkiem poza bundlerem
 * Next.js (psuje Vitest i skrypty verify:* uruchamiane przez tsx). Ochronę przed
 * importem klienckim daje sam brak `NEXT_PUBLIC_` prefiksu klucza serwisowego.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
