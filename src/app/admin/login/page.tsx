"use client";

import { useState, useTransition } from "react";
import { sendLoginCode, verifyLoginCode } from "./actions";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendLoginCode(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("code");
    });
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyLoginCode(email, code);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-2xl font-bold">Panel administratora</h1>

      {step === "email" ? (
        <form onSubmit={submitEmail} className="flex flex-col gap-4">
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
            {isPending ? "Wysyłanie…" : "Wyślij kod logowania"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="flex flex-col gap-4">
          <p className="text-center text-gray-600">
            Wysłaliśmy 8-cyfrowy kod na adres {email}. Wpisz go poniżej.
          </p>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Kod logowania</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              autoFocus
              className="h-14 rounded-lg border border-gray-300 px-3 text-center text-2xl tracking-widest"
              placeholder="00000000"
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
            {isPending ? "Sprawdzanie…" : "Zaloguj się"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-center text-gray-500 underline"
          >
            Zmień adres e-mail
          </button>
        </form>
      )}
    </div>
  );
}
