import { createClient } from "@/lib/supabase/server";
import { calculateHours, summarizeEarnings, type EarningsEntry } from "@/lib/time/calculate";

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
    .lte("work_date", to);

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

  const grandTotalHours = summaries.reduce((sum, s) => sum + s.totalHours, 0);
  const grandTotalAmount = summaries.reduce((sum, s) => sum + s.totalAmount, 0);

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

      {summaries.length === 0 && (
        <p className="text-gray-500">Brak wpisów w wybranym okresie.</p>
      )}

      <div className="flex flex-col gap-6">
        {summaries.map((summary) => (
          <div key={summary.employeeId} className="rounded-xl bg-white p-5 shadow ring-1 ring-gray-200">
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
                    <td className="py-2">{row.hourlyRate.toFixed(2)} zł/h</td>
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

      {summaries.length > 1 && (
        <div className="rounded-xl bg-blue-50 p-5 ring-1 ring-blue-200">
          <p className="text-lg font-bold">
            Razem wszyscy: {grandTotalHours.toFixed(2)} h — {grandTotalAmount.toFixed(2)} zł
          </p>
        </div>
      )}
    </div>
  );
}
