"use client";

import { useState } from "react";
import { round2 } from "@/lib/time/calculate";

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

export function RozliczenieSummary({ summaries }: { summaries: Summary[] }) {
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  function setRate(employeeId: string, workTypeId: string, value: string) {
    const parsed = Number(value.replace(",", "."));
    setOverrides((prev) => ({
      ...prev,
      [overrideKey(employeeId, workTypeId)]: Number.isFinite(parsed) ? parsed : 0,
    }));
  }

  const adjusted = summaries.map((summary) => {
    const rows = summary.rows.map((row) => {
      const rate = overrides[overrideKey(summary.employeeId, row.workTypeId)] ?? row.hourlyRate;
      return { ...row, effectiveRate: rate, amount: round2(row.hours * rate) };
    });
    const totalAmount = round2(rows.reduce((sum, r) => sum + r.amount, 0));
    return { ...summary, rows, totalAmount };
  });

  const grandTotalHours = round2(adjusted.reduce((sum, s) => sum + s.totalHours, 0));
  const grandTotalAmount = round2(adjusted.reduce((sum, s) => sum + s.totalAmount, 0));

  if (adjusted.length === 0) {
    return <p className="text-gray-500">Brak wpisów w wybranym okresie.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-gray-500">
        Stawkę można ręcznie zmienić tylko dla tego rozliczenia (poniżej) — nie zmienia to
        domyślnej stawki w „Rodzaje pracy”.
      </p>

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
            <p className="mt-3 text-lg font-semibold">
              Razem: {summary.totalHours.toFixed(2)} h — {summary.totalAmount.toFixed(2)} zł
            </p>
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
