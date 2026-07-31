import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // implicit zamiast domyślnego pkce: link logowania z maila może zostać
      // otwarty w innej przeglądarce/kontekście niż ta, która go zażądała
      // (np. wbudowana przeglądarka aplikacji Mail na telefonie) — pkce tego
      // nie przetrwa, bo wymaga code_verifier z tej samej przeglądarki.
      auth: { flowType: "implicit" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // wywołane z Server Component bez możliwości zapisu cookie —
            // middleware odświeża sesję, więc to bezpieczne do zignorowania
          }
        },
      },
    },
  );
}
