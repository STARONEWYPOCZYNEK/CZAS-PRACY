"use client";

import { useState, useTransition } from "react";
import { calculateHours } from "@/lib/time/calculate";
import { createEntry, updateEntry, deleteEntry, type EntryInput } from "./actions";

interface WorkType {
  id: string;
  name: string;
}

interface Entry {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  description: string;
  workTypeId: string;
  workTypeName: string;
  editable: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): EntryInput {
  return { workDate: todayIso(), workTypeId: "", startTime: "", endTime: "", description: "" };
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <div className="flex gap-2">
        <select
          value={hour}
          onChange={(e) => onChange(`${e.target.value}:${minute || "00"}`)}
          className="h-14 flex-1 rounded-lg border border-gray-300 px-2 text-lg"
          required
        >
          <option value="">Godz.</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          value={minute}
          onChange={(e) => onChange(`${hour || "00"}:${e.target.value}`)}
          className="h-14 flex-1 rounded-lg border border-gray-300 px-2 text-lg"
          required
        >
          <option value="">Min.</option>
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function EntryForm({
  workTypes,
  entries,
}: {
  workTypes: WorkType[];
  entries: Entry[];
}) {
  const [form, setForm] = useState<EntryInput>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      workDate: entry.workDate,
      workTypeId: entry.workTypeId,
      startTime: entry.startTime.slice(0, 5),
      endTime: entry.endTime.slice(0, 5),
      description: entry.description,
    });
    setError(null);
    setSuccess(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = editingId
        ? await updateEntry(editingId, form)
        : await createEntry(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setEditingId(null);
      setForm(emptyForm());
    });
  }

  function remove(entryId: string) {
    if (!confirm("Na pewno usunąć ten wpis?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEntry(entryId);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  const hours =
    form.startTime && form.endTime ? calculateHours(form.startTime, form.endTime) : null;

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow ring-1 ring-gray-200">
        <h2 className="text-xl font-semibold">
          {editingId ? "Edytuj wpis" : "Nowy wpis"}
        </h2>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Data</span>
          <input
            type="date"
            value={form.workDate}
            onChange={(e) => setForm({ ...form, workDate: e.target.value })}
            className="h-14 rounded-lg border border-gray-300 px-3 text-lg"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Rodzaj pracy</span>
          <select
            value={form.workTypeId}
            onChange={(e) => setForm({ ...form, workTypeId: e.target.value })}
            className="h-14 rounded-lg border border-gray-300 px-3 text-lg"
            required
          >
            <option value="">Wybierz…</option>
            {workTypes.map((wt) => (
              <option key={wt.id} value={wt.id}>
                {wt.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-3">
          <TimeSelect
            label="Rozpoczęcie"
            value={form.startTime}
            onChange={(startTime) => setForm({ ...form, startTime })}
          />
          <TimeSelect
            label="Zakończenie"
            value={form.endTime}
            onChange={(endTime) => setForm({ ...form, endTime })}
          />
        </div>

        {hours !== null && (
          <p className="text-gray-600">
            Przepracowane godziny: <strong>{hours.toFixed(2)} h</strong>
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="font-medium">Opis pracy</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-24 rounded-lg border border-gray-300 p-3 text-lg"
            placeholder="Co było robione…"
          />
        </label>

        {error && (
          <p className="font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && <p className="font-medium text-green-700">Zapisano wpis.</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="btn-big flex-1 bg-blue-600 text-white disabled:opacity-50"
          >
            {isPending ? "Zapisywanie…" : "Zapisz"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="btn-big bg-gray-100 text-gray-600"
            >
              Anuluj
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Twoje ostatnie wpisy</h2>
        {entries.length === 0 && <p className="text-gray-500">Brak wpisów.</p>}
        {entries.map((entry) => {
          return (
            <div
              key={entry.id}
              className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow ring-1 ring-gray-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{entry.workDate}</span>
                <span className="text-gray-500">{entry.workTypeName}</span>
              </div>
              <p className="text-gray-700">
                {entry.startTime.slice(0, 5)}–{entry.endTime.slice(0, 5)} (
                {calculateHours(entry.startTime.slice(0, 5), entry.endTime.slice(0, 5)).toFixed(2)}{" "}
                h)
              </p>
              {entry.description && <p className="text-gray-600">{entry.description}</p>}
              {entry.editable ? (
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    className="text-blue-600 underline"
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(entry.id)}
                    className="text-red-600 underline"
                  >
                    Usuń
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Minęło 24h — poproś administratora o zmianę
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
