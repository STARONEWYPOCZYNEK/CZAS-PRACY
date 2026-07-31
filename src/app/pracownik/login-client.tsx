"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginWithPin } from "./actions";

interface Employee {
  id: string;
  full_name: string;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function LoginClient({ employees }: { employees: Employee[] }) {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!selected) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <h1 className="mb-2 text-center text-2xl font-bold">
          Wybierz swoje imię
        </h1>
        {employees.length === 0 && (
          <p className="text-center text-gray-500">
            Brak aktywnych pracowników. Skontaktuj się z administratorem.
          </p>
        )}
        {employees.map((employee) => (
          <button
            key={employee.id}
            onClick={() => {
              setSelected(employee);
              setError(null);
              setPin("");
            }}
            className="btn-big bg-white text-gray-800 shadow ring-1 ring-gray-300"
          >
            {employee.full_name}
          </button>
        ))}
        <Link href="/" className="mt-4 text-center text-gray-500">
          ← Wróć
        </Link>
      </div>
    );
  }

  function submitPin(nextPin: string) {
    startTransition(async () => {
      const result = await loginWithPin(selected!.id, nextPin);
      if (result?.error) {
        setError(result.error);
        setPin("");
      }
    });
  }

  function pressDigit(digit: string) {
    if (pin.length >= 4 || isPending) return;
    const next = pin + digit;
    setPin(next);
    setError(null);
    if (next.length === 4) {
      submitPin(next);
    }
  }

  function backspace() {
    if (isPending) return;
    setPin((p) => p.slice(0, -1));
    setError(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-center text-2xl font-bold">
        Cześć, {selected.full_name}
      </h1>
      <p className="text-gray-500">Wpisz swój 4-cyfrowy PIN</p>

      <div className="flex gap-3" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-5 w-5 rounded-full border-2 ${
              pin.length > i
                ? "border-blue-600 bg-blue-600"
                : "border-gray-400 bg-transparent"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-center font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="grid w-full grid-cols-3 gap-3">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => pressDigit(digit)}
            disabled={isPending}
            className="btn-big bg-white text-2xl text-gray-800 shadow ring-1 ring-gray-300 disabled:opacity-50"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setPin("");
            setError(null);
          }}
          className="btn-big bg-gray-100 text-gray-600"
        >
          Wróć
        </button>
        <button
          type="button"
          onClick={() => pressDigit("0")}
          disabled={isPending}
          className="btn-big bg-white text-2xl text-gray-800 shadow ring-1 ring-gray-300 disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={isPending || pin.length === 0}
          className="btn-big bg-gray-100 text-gray-600 disabled:opacity-50"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
