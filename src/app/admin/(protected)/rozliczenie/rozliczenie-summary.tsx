"use client";

import { useState, useTransition } from "react";
import { round2 } from "@/lib/time/calculate";
import { approveSettlement } from "./actions";

interface Row {
  workTypeId: string;
  workTypeName: string;
  hourlyRate: number;
  hours: number;
}

interface Summary {
  employeeId: string;
  employeeName: string;
  rows: Row[];
  totalHours: number;
}

function overrideKey(employeeId: string, workTypeId: string): string {
  return `${employeeId}:${workTypeId}`;
}

export function RozliczenieSummary({
  summaries,
  periodFrom,
  periodTo,
}: {
  summaries: Summary[];
  periodFrom: string;
  periodTo: string;
}) {
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [confirmingEmployeeId, setConfirmingEmployeeId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setRate(employeeId: string, workTypeId: string, value: string) {
    const parsed = Number(value.replace(",", "."));
    setOverrides((prev) => ({
      ...prev,
      [overrideKey(employeeId, workTypeId)]: Number.isFinite(parsed) ? parsed : 0,
    }));
  }

  const adjusted = summaries
    .filter((s) => !approvedIds.includes(s.employeeId))
    .map((summary) => {
      const rows = summary.rows.map((row) => {
        const rate = overrides[overrideKey(summary.employeeId, row.workTypeId)] ?? row.hourlyRate;
        return { ...row, effectiveRate: rate, amount: round2(row.hours * rate) };
      });
      const totalAmount = round2(rows.reduce((sum, r) => sum + r.amount, 0));
      return { ...summary, rows, totalAmount };
    });

  const grandTotalHours = round2(adjusted.reduce((sum, s) => sum + s.totalHours, 0));
  const grandTotalAmount = round2(adjusted.reduce((sum, s) => sum + s.totalAmount, 0));

  function approve(summary: (typeof adjusted)[number]) {
    setError(null);
    startTransition(async () => {
      const result = await approveSettlement(
        summary.employeeId,
        periodFrom,
        periodTo,
        summary.rows.map((r) => ({
          workTypeId: r.workTypeId,
          workTypeName: r.workTypeName,
          hourlyRate: r.effectiveRate,
          hours: r.hours,
          amount: r.amount,
        })),
      );
      if ("error" in result) {
        setError(result.error);
        setConfirmingEmployeeId(null);
        return;
      }
      setApprovedIds((prev) => [...prev, summary.employeeId]);
      setConfirmingEmployeeId(null);
    });
  }

  if (adjusted.length === 0) {
    return <p className="text-gray-500">Brak nierozliczonych wpisów w wybranym okresie.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-gray-500">
        Stawkę można ręcznie zmienić tylko dla tego rozliczenia (poniżej) — nie zmienia to
        domyślnej stawki w „Rodzaje pracy”.
      </p>

      {error && (
        <p className="font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {adjusted.map((summary) => (
          <div
            key={summary.employeeId}
            className="rounded-xl bg-white p-5 shadow ring-1 ring-gray-200"
          >
            <h2 className="mb-3 text-xl font-semibold">{summary.employeeName}</h2>
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 text-sm text-gray-500">
                <tr>
                  <th className="py-2">Rodzaj pracy</th>
                  <th className="py-2">Stawka</th>
                  <th className="py-2">Godziny</th>
                  <th className="py-2">Kwota</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row) => (
                  <tr key={row.workTypeId} className="border-b border-gray-100">
                    <td className="py-2">{row.workTypeName}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <input
                          defaultValue={row.effectiveRate}
                          onChange={(e) =>
                            setRate(summary.employeeId, row.workTypeId, e.target.value)
                          }
                          inputMode="decimal"
                          className="h-9 w-20 rounded border border-gray-300 px-2"
                        />
                        <span className="text-gray-500">zł/h</span>
                      </div>
                    </td>
                    <td className="py-2">{row.hours.toFixed(2)} h</td>
                    <td className="py-2">{row.amount.toFixed(2)} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-semibold">
                Razem: {summary.totalHours.toFixed(2)} h — {summary.totalAmount.toFixed(2)} zł
              </p>

              {confirmingEmployeeId === summary.employeeId ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
                  <span className="font-medium text-amber-800">
                    Zatwierdzić? Wpisy z tego okresu zostaną zablokowane do edycji.
                  </span>
                  <button
                    onClick={() => approve(summary)}
                    disabled={isPending}
                    className="rounded bg-green-600 px-3 py-1.5 text-white disabled:opacity-50"
                  >
                    Tak, zatwierdź
                  </button>
                  <button
                    onClick={() => setConfirmingEmployeeId(null)}
                    className="rounded bg-white px-3 py-1.5 ring-1 ring-gray-300"
                  >
                    Anuluj
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingEmployeeId(summary.employeeId)}
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
                >
                  Zatwierdź rozliczenie
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {adjusted.length > 1 && (
        <div className="rounded-xl bg-blue-50 p-5 ring-1 ring-blue-200">
          <p className="text-lg font-bold">
            Razem wszyscy: {grandTotalHours.toFixed(2)} h — {grandTotalAmount.toFixed(2)} zł
          </p>
        </div>
      )}
    </div>
  );
}
