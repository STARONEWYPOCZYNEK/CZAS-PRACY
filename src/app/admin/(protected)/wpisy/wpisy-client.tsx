"use client";

import { useState, useTransition } from "react";
import { calculateHours } from "@/lib/time/calculate";
import {
  adminCreateEntry,
  adminUpdateEntry,
  adminDeleteEntry,
  type AdminEntryInput,
} from "./actions";

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
  settled: boolean;
  isPossibleDuplicate: boolean;
}

interface Employee {
  id: string;
  full_name: string;
}

interface WorkType {
  id: string;
  name: string;
}

function emptyForm(employees: Employee[], workTypes: WorkType[]): AdminEntryInput {
  return {
    employeeId: employees[0]?.id ?? "",
    workTypeId: workTypes[0]?.id ?? "",
    workDate: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    description: "",
  };
}

function EntryFields({
  form,
  setForm,
  employees,
  workTypes,
}: {
  form: AdminEntryInput;
  setForm: (form: AdminEntryInput) => void;
  employees: Employee[];
  workTypes: WorkType[];
}) {
  return (
    <>
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
      <input
        type="date"
        value={form.workDate}
        onChange={(e) => setForm({ ...form, workDate: e.target.value })}
        className="h-10 rounded border border-gray-300 px-2"
      />
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
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Opis"
        className="h-10 w-full rounded border border-gray-300 px-2"
      />
    </>
  );
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
  const [addForm, setAddForm] = useState<AdminEntryInput>(() => emptyForm(employees, workTypes));
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminEntryInput | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminCreateEntry(addForm);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAddForm(emptyForm(employees, workTypes));
      setShowAddForm(false);
    });
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditForm({
      employeeId: entry.employeeId,
      workTypeId: entry.workTypeId,
      workDate: entry.workDate,
      startTime: entry.startTime.slice(0, 5),
      endTime: entry.endTime.slice(0, 5),
      description: entry.description,
    });
    setError(null);
  }

  function saveEdit(entryId: string) {
    if (!editForm) return;
    setError(null);
    startTransition(async () => {
      const result = await adminUpdateEntry(entryId, editForm);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      setEditForm(null);
    });
  }

  function confirmDelete(entryId: string) {
    setError(null);
    startTransition(async () => {
      const result = await adminDeleteEntry(entryId);
      if ("error" in result) {
        setError(result.error);
      }
      setConfirmingDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      {showAddForm ? (
        <form
          onSubmit={submitAdd}
          className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-gray-200 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <EntryFields
            form={addForm}
            setForm={setAddForm}
            employees={employees}
            workTypes={workTypes}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="h-10 rounded bg-blue-600 px-4 text-white disabled:opacity-50"
            >
              Dodaj
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="h-10 rounded px-3 text-gray-500"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-fit rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white"
        >
          + Dodaj wpis
        </button>
      )}

      {entries.length === 0 ? (
        <p className="text-gray-500">Brak wpisów dla wybranych filtrów.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow ring-1 ring-gray-200">
          <table className="w-full min-w-[760px] text-left">
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
              {entries.map((entry) => {
                if (editingId === entry.id && editForm) {
                  return (
                    <tr key={entry.id} className="border-b border-gray-100 bg-blue-50">
                      <td colSpan={5} className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <EntryFields
                            form={editForm}
                            setForm={setEditForm}
                            employees={employees}
                            workTypes={workTypes}
                          />
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <button
                          onClick={() => saveEdit(entry.id)}
                          disabled={isPending}
                          className="mr-2 rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
                        >
                          Zapisz
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                          }}
                          className="text-gray-500"
                        >
                          Anuluj
                        </button>
                      </td>
                    </tr>
                  );
                }

                if (confirmingDeleteId === entry.id) {
                  return (
                    <tr key={entry.id} className="border-b border-gray-100 bg-red-50">
                      <td colSpan={6} className="p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="font-medium text-red-800">
                            Na pewno usunąć wpis {entry.employeeName} ({entry.workDate},{" "}
                            {entry.startTime.slice(0, 5)}–{entry.endTime.slice(0, 5)})? To
                            nieodwracalne.
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmDelete(entry.id)}
                              disabled={isPending}
                              className="rounded bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
                            >
                              Tak, usuń
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteId(null)}
                              className="rounded bg-white px-3 py-1.5 ring-1 ring-gray-300"
                            >
                              Anuluj
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={entry.id} className="border-b border-gray-100">
                    <td className="p-3">{entry.workDate}</td>
                    <td className="p-3">{entry.employeeName}</td>
                    <td className="p-3">{entry.workTypeName}</td>
                    <td className="p-3">
                      {entry.startTime.slice(0, 5)}–{entry.endTime.slice(0, 5)} (
                      {calculateHours(
                        entry.startTime.slice(0, 5),
                        entry.endTime.slice(0, 5),
                      ).toFixed(2)}{" "}
                      h)
                    </td>
                    <td className="p-3 text-gray-600">
                      {entry.description}
                      <div className="mt-1 flex gap-1">
                        {entry.isPossibleDuplicate && (
                          <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                            Możliwy duplikat
                          </span>
                        )}
                        {entry.settled && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Rozliczone
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {entry.settled ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(entry)}
                            className="mr-3 text-blue-600 underline"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => setConfirmingDeleteId(entry.id)}
                            className="text-red-600 underline"
                          >
                            Usuń
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
