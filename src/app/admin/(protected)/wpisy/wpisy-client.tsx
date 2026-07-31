"use client";

import { useState, useTransition } from "react";
import { calculateHours } from "@/lib/time/calculate";
import { adminUpdateEntry, adminDeleteEntry, type AdminEntryInput } from "./actions";

interface Entry {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  description: string;
  employeeId: string;
  workTypeId: string;
  employeeName: string;
  workTypeName: string;
}

interface Employee {
  id: string;
  full_name: string;
}

interface WorkType {
  id: string;
  name: string;
}

export function WpisyClient({
  entries,
  employees,
  workTypes,
}: {
  entries: Entry[];
  employees: Employee[];
  workTypes: WorkType[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminEntryInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      employeeId: entry.employeeId,
      workTypeId: entry.workTypeId,
      workDate: entry.workDate,
      startTime: entry.startTime.slice(0, 5),
      endTime: entry.endTime.slice(0, 5),
      description: entry.description,
    });
    setError(null);
  }

  function save(entryId: string) {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const result = await adminUpdateEntry(entryId, form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      setForm(null);
    });
  }

  function remove(entryId: string) {
    if (!confirm("Na pewno usunąć ten wpis?")) return;
    startTransition(async () => {
      await adminDeleteEntry(entryId);
    });
  }

  if (entries.length === 0) {
    return <p className="text-gray-500">Brak wpisów dla wybranych filtrów.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl bg-white shadow ring-1 ring-gray-200">
        <table className="w-full min-w-[720px] text-left">
          <thead className="border-b border-gray-200 text-sm text-gray-500">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Pracownik</th>
              <th className="p-3">Rodzaj pracy</th>
              <th className="p-3">Godziny</th>
              <th className="p-3">Opis</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) =>
              editingId === entry.id && form ? (
                <tr key={entry.id} className="border-b border-gray-100 bg-blue-50">
                  <td className="p-3">
                    <input
                      type="date"
                      value={form.workDate}
                      onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                      className="h-10 rounded border border-gray-300 px-2"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                      className="h-10 rounded border border-gray-300 px-2"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={form.workTypeId}
                      onChange={(e) => setForm({ ...form, workTypeId: e.target.value })}
                      className="h-10 rounded border border-gray-300 px-2"
                    >
                      {workTypes.map((wt) => (
                        <option key={wt.id} value={wt.id}>
                          {wt.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        className="h-10 w-24 rounded border border-gray-300 px-1"
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        className="h-10 w-24 rounded border border-gray-300 px-1"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="h-10 w-full rounded border border-gray-300 px-2"
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      onClick={() => save(entry.id)}
                      disabled={isPending}
                      className="mr-2 rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
                    >
                      Zapisz
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setForm(null);
                      }}
                      className="text-gray-500"
                    >
                      Anuluj
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="p-3">{entry.workDate}</td>
                  <td className="p-3">{entry.employeeName}</td>
                  <td className="p-3">{entry.workTypeName}</td>
                  <td className="p-3">
                    {entry.startTime.slice(0, 5)}–{entry.endTime.slice(0, 5)} (
                    {calculateHours(entry.startTime.slice(0, 5), entry.endTime.slice(0, 5)).toFixed(2)}{" "}
                    h)
                  </td>
                  <td className="p-3 text-gray-600">{entry.description}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button onClick={() => startEdit(entry)} className="mr-3 text-blue-600 underline">
                      Edytuj
                    </button>
                    <button onClick={() => remove(entry.id)} className="text-red-600 underline">
                      Usuń
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
