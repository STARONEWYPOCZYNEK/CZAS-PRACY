import { createClient } from "@/lib/supabase/server";
import { calculateHours, summarizeEarnings, type EarningsEntry } from "@/lib/time/calculate";
import { RozliczenieSummary } from "./rozliczenie-summary";

interface SearchParams {
  employeeId?: string;
  from?: string;
  to?: string;
}

function defaultMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default async function RozliczeniePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const defaults = defaultMonthRange();
  const from = params.from || defaults.from;
  const to = params.to || defaults.to;

  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .order("full_name");

  let query = supabase
    .from("time_entries")
    .select(
      "employee_id, start_time, end_time, employees(full_name), work_types(id, name, hourly_rate)",
    )
    .gte("work_date", from)
    .lte("work_date", to)
    .is("settlement_id", null);

  if (params.employeeId) query = query.eq("employee_id", params.employeeId);

  const { data: rows } = await query;

  const byEmployee = new Map<
    string,
    { employeeName: string; entries: EarningsEntry[] }
  >();

  for (const row of rows ?? []) {
    const workType = row.work_types as unknown as {
      id: string;
      name: string;
      hourly_rate: number;
    } | null;
    const employee = row.employees as unknown as { full_name: string } | null;
    if (!workType || !employee) continue;

    const hours = calculateHours(row.start_time.slice(0, 5), row.end_time.slice(0, 5));

    const bucket = byEmployee.get(row.employee_id) ?? {
      employeeName: employee.full_name,
      entries: [],
    };
    bucket.entries.push({
      workTypeId: workType.id,
      workTypeName: workType.name,
      hourlyRate: workType.hourly_rate,
      hours,
    });
    byEmployee.set(row.employee_id, bucket);
  }

  const summaries = [...byEmployee.entries()]
    .map(([employeeId, { employeeName, entries }]) => ({
      employeeId,
      employeeName,
      ...summarizeEarnings(entries),
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "pl"));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Rozliczenie</h1>

      <form className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow ring-1 ring-gray-200">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Pracownik</span>
          <select
            name="employeeId"
            defaultValue={params.employeeId ?? ""}
            className="h-11 rounded-lg border border-gray-300 px-3"
          >
            <option value="">Wszyscy</option>
            {(employees ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Od</span>
          <input type="date" name="from" defaultValue={from} className="h-11 rounded-lg border border-gray-300 px-3" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Do</span>
          <input type="date" name="to" defaultValue={to} className="h-11 rounded-lg border border-gray-300 px-3" />
        </label>
        <button type="submit" className="h-11 rounded-lg bg-blue-600 px-5 font-semibold text-white">
          Przelicz
        </button>
      </form>

      <RozliczenieSummary summaries={summaries} periodFrom={from} periodTo={to} />
    </div>
  );
}
