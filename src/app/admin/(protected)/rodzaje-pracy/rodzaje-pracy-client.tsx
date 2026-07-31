"use client";

import { useState, useTransition } from "react";
import { addWorkType, updateWorkTypeRate, setWorkTypeActive } from "./actions";

interface WorkType {
  id: string;
  name: string;
  hourly_rate: number;
  active: boolean;
}

export function RodzajePracyClient({ workTypes }: { workTypes: WorkType[] }) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [rateEdits, setRateEdits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addWorkType(name, Number(rate));
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
      setRate("");
    });
  }

  function saveRate(workTypeId: string) {
    const value = rateEdits[workTypeId];
    setError(null);
    startTransition(async () => {
      const result = await updateWorkTypeRate(workTypeId, Number(value));
      if ("error" in result) setError(result.error);
    });
  }

  function toggleActive(workTypeId: string, active: boolean) {
    startTransition(async () => {
      await setWorkTypeActive(workTypeId, active);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={submitAdd}
        className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow ring-1 ring-gray-200 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1">
          <span className="font-medium">Nazwa rodzaju pracy</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-lg border border-gray-300 px-3"
            placeholder="np. Mycie aut"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Stawka PLN/h</span>
          <input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            className="h-12 w-32 rounded-lg border border-gray-300 px-3"
            required
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-lg bg-blue-600 px-5 font-semibold text-white disabled:opacity-50"
        >
          Dodaj
        </button>
      </form>

      {error && (
        <p className="font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {workTypes.map((wt) => (
          <div
            key={wt.id}
            className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold">{wt.name}</p>
              <p className={wt.active ? "text-green-700" : "text-gray-400"}>
                {wt.active ? "Aktywny" : "Nieaktywny"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                defaultValue={wt.hourly_rate}
                onChange={(e) =>
                  setRateEdits((prev) => ({ ...prev, [wt.id]: e.target.value }))
                }
                inputMode="decimal"
                className="h-10 w-24 rounded-lg border border-gray-300 px-3"
              />
              <span className="text-gray-500">PLN/h</span>
              <button
                onClick={() => saveRate(wt.id)}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
              >
                Zapisz stawkę
              </button>
              <button
                onClick={() => toggleActive(wt.id, !wt.active)}
                disabled={isPending}
                className="text-gray-600 underline disabled:opacity-50"
              >
                {wt.active ? "Dezaktywuj" : "Aktywuj"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
