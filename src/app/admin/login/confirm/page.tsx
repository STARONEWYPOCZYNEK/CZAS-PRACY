"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const hashError = params.get("error_description");

      if (hashError) {
        if (!cancelled) setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
        return;
      }

      if (!accessToken || !refreshToken) {
        if (!cancelled) {
          setError("Link logowania jest nieprawidłowy lub wygasł. Poproś o nowy.");
        }
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (cancelled) return;

      if (sessionError) {
        setError("Nie udało się dokończyć logowania. Poproś o nowy link.");
        return;
      }

      router.replace("/admin");
    }

    confirm();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-bold">Logowanie nie powiodło się</h1>
          <p className="text-red-600">{error}</p>
          <a href="/admin/login" className="btn-big bg-blue-600 text-white">
            Wyślij nowy link
          </a>
        </>
      ) : (
        <p className="text-gray-600">Logowanie…</p>
      )}
    </div>
  );
}
