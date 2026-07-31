import { createClient } from "@/lib/supabase/server";
import { WpisyClient } from "./wpisy-client";

interface SearchParams {
  employeeId?: string;
  from?: string;
  to?: string;
}

export default async function WpisyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: employees }, { data: workTypes }] = await Promise.all([
    supabase.from("employees").select("id, full_name").order("full_name"),
    supabase.from("work_types").select("id, name, active").order("name"),
  ]);

  let query = supabase
    .from("time_entries")
    .select(
      "id, work_date, start_time, end_time, description, employee_id, work_type_id, settlement_id, employees(full_name), work_types(name)",
    )
    .order("work_date", { ascending: false });

  if (params.employeeId) query = query.eq("employee_id", params.employeeId);
  if (params.from) query = query.gte("work_date", params.from);
  if (params.to) query = query.lte("work_date", params.to);

  const { data: entries } = await query.limit(500);

  const duplicateCounts = new Map<string, number>();
  for (const e of entries ?? []) {
    const key = `${e.employee_id}|${e.work_date}|${e.start_time}|${e.end_time}`;
    duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Wpisy</h1>

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
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="h-11 rounded-lg border border-gray-300 px-3"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Do</span>
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="h-11 rounded-lg border border-gray-300 px-3"
          />
        </label>
        <button type="submit" className="h-11 rounded-lg bg-blue-600 px-5 font-semibold text-white">
          Filtruj
        </button>
      </form>

      <WpisyClient
        entries={(entries ?? []).map((e) => {
          const key = `${e.employee_id}|${e.work_date}|${e.start_time}|${e.end_time}`;
          return {
            id: e.id,
            workDate: e.work_date,
            startTime: e.start_time,
            endTime: e.end_time,
            description: e.description,
            employeeId: e.employee_id,
            workTypeId: e.work_type_id,
            employeeName: (e.employees as unknown as { full_name: string } | null)?.full_name ?? "—",
            workTypeName: (e.work_types as unknown as { name: string } | null)?.name ?? "—",
            settled: e.settlement_id !== null,
            isPossibleDuplicate: (duplicateCounts.get(key) ?? 0) > 1,
          };
        })}
        employees={employees ?? []}
        workTypes={(workTypes ?? []).filter((wt) => wt.active)}
      />
    </div>
  );
}
