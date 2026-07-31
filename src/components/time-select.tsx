"use client";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export function TimeSelect({
  label,
  value,
  onChange,
  compact = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];
  const selectClass = compact
    ? "h-10 w-20 rounded border border-gray-300 px-1"
    : "h-14 flex-1 rounded-lg border border-gray-300 px-2 text-lg";

  const selects = (
    <div className="flex items-center gap-1">
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute || "00"}`)}
        className={selectClass}
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
        className={selectClass}
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
  );

  if (!label) return selects;

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      {selects}
    </div>
  );
}
