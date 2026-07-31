"use client";

import { useState, useTransition } from "react";
import { sendMagicLink } from "./actions";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendMagicLink(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-2xl font-bold">Panel administratora</h1>

      {sent ? (
        <p className="text-center text-green-700">
          Link do logowania wysłany na {email}. Sprawdź skrzynkę e-mail.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Adres e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-lg border border-gray-300 px-3 text-lg"
              required
            />
          </label>
          {error && (
            <p className="font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="btn-big bg-blue-600 text-white disabled:opacity-50"
          >
            {isPending ? "Wysyłanie…" : "Wyślij link logowania"}
          </button>
        </form>
      )}
    </div>
  );
}
