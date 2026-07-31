"use client";

import { useState, useTransition } from "react";
import { addEmployee, setEmployeeActive, resetEmployeePin } from "./actions";

interface Employee {
  id: string;
  full_name: string;
  active: boolean;
  created_at: string;
}

export function PracownicyClient({ employees }: { employees: Employee[] }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPin, setResetPin] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addEmployee(name, pin);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
      setPin("");
    });
  }

  function toggleActive(employeeId: string, active: boolean) {
    startTransition(async () => {
      await setEmployeeActive(employeeId, active);
    });
  }

  function submitResetPin(employeeId: string) {
    setError(null);
    startTransition(async () => {
      const result = await resetEmployeePin(employeeId, resetPin);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setResetTarget(null);
      setResetPin("");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={submitAdd}
        className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow ring-1 ring-gray-200 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="font-medium">Imię i nazwisko</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-lg border border-gray-300 px-3"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Początkowy PIN (4 cyfry)</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            className="h-12 w-32 rounded-lg border border-gray-300 px-3"
            required
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-lg bg-blue-600 px-5 font-semibold text-white disabled:opacity-50"
        >
          Dodaj pracownika
        </button>
      </form>

      {error && (
        <p className="font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold">{employee.full_name}</p>
              <p className={employee.active ? "text-green-700" : "text-gray-400"}>
                {employee.active ? "Aktywny" : "Nieaktywny"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {resetTarget === employee.id ? (
                <>
                  <input
                    value={resetPin}
                    onChange={(e) => setResetPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    placeholder="nowy PIN"
                    className="h-10 w-28 rounded-lg border border-gray-300 px-3"
                  />
                  <button
                    onClick={() => submitResetPin(employee.id)}
                    disabled={isPending}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
                  >
                    Zapisz PIN
                  </button>
                  <button
                    onClick={() => {
                      setResetTarget(null);
                      setResetPin("");
                    }}
                    className="text-gray-500"
                  >
                    Anuluj
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setResetTarget(employee.id)}
                  className="text-blue-600 underline"
                >
                  Resetuj PIN
                </button>
              )}
              <button
                onClick={() => toggleActive(employee.id, !employee.active)}
                disabled={isPending}
                className="text-gray-600 underline disabled:opacity-50"
              >
                {employee.active ? "Dezaktywuj" : "Aktywuj"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
