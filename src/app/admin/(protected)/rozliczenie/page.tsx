import { createClient } from "@/lib/supabase/server";
import { calculateHours, summarizeEarnings, type EarningsEntry } from "@/lib/time/calculate";
import { RozliczenieSummary } from "./rozliczenie-summary";

interface SearchParams {
  employeeId?: string;
  from?: string;
  to?: string;
}

function currentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function RozliczeniePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name")
    .order("full_name");

  // Domyślny zakres = od najstarszego nierozliczonego wpisu, żeby zaległe dni
  // (np. wprowadzone z opóźnieniem) nie zniknęły po cichu z podsumowania —
  // dopiero jeśli w ogóle nie ma nierozliczonych wpisów, wracamy do bieżącego miesiąca.
  let earliestUnsettledQuery = supabase
    .from("time_entries")
    .select("work_date")
    .is("settlement_id", null)
    .order("work_date", { ascending: true })
    .limit(1);
  if (params.employeeId) earliestUnsettledQuery = earliestUnsettledQuery.eq("employee_id", params.employeeId);
  const { data: earliestUnsettled } = await earliestUnsettledQuery.maybeSingle();

  const from = params.from || earliestUnsettled?.work_date || currentMonthStart();
  const to = params.to || todayIso();

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

  // Ostrzeżenie na wypadek gdyby admin ręcznie zawęził zakres i zostawił
  // starsze nierozliczone wpisy poza widokiem — zawsze widoczne, niezależnie
  // od tego czy zakres jest domyślny czy wybrany ręcznie.
  let olderUnsettledCountQuery = supabase
    .from("time_entries")
    .select("id", { count: "exact", head: true })
    .is("settlement_id", null)
    .lt("work_date", from);
  if (params.employeeId) {
    olderUnsettledCountQuery = olderUnsettledCountQuery.eq("employee_id", params.employeeId);
  }
  const { count: olderUnsettledCount } = await olderUnsettledCountQuery;

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

      {(olderUnsettledCount ?? 0) > 0 && (
        <p className="rounded-lg bg-amber-50 p-3 font-medium text-amber-800 ring-1 ring-amber-200">
          Uwaga: poza wybranym zakresem jest jeszcze {olderUnsettledCount}{" "}
          {olderUnsettledCount === 1 ? "starszy nierozliczony wpis" : "starszych nierozliczonych wpisów"}{" "}
          (przed {from}) — nieujęte w poniższym podsumowaniu. Cofnij datę „Od”, żeby je zobaczyć.
        </p>
      )}

      <RozliczenieSummary summaries={summaries} periodFrom={from} periodTo={to} />
    </div>
  );
}
