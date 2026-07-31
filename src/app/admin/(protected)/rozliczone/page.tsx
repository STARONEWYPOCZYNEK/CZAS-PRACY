import { createClient } from "@/lib/supabase/server";

interface SearchParams {
  employeeId?: string;
  from?: string;
  to?: string;
}

export default async function RozliczonePage({
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

  let query = supabase
    .from("settlements")
    .select("id, employee_id, period_from, period_to, total_hours, total_amount, approved_at, employees(full_name)")
    .order("approved_at", { ascending: false });

  if (params.employeeId) query = query.eq("employee_id", params.employeeId);
  if (params.from) query = query.gte("period_from", params.from);
  if (params.to) query = query.lte("period_to", params.to);

  const { data: settlements } = await query.limit(200);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Rozliczone</h1>

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

      {!settlements || settlements.length === 0 ? (
        <p className="text-gray-500">Brak zatwierdzonych rozliczeń dla wybranych filtrów.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow ring-1 ring-gray-200">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-gray-200 text-sm text-gray-500">
              <tr>
                <th className="p-3">Pracownik</th>
                <th className="p-3">Okres</th>
                <th className="p-3">Godziny</th>
                <th className="p-3">Kwota</th>
                <th className="p-3">Zatwierdzono</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="p-3">
                    {(s.employees as unknown as { full_name: string } | null)?.full_name ?? "—"}
                  </td>
                  <td className="p-3">
                    {s.period_from} – {s.period_to}
                  </td>
                  <td className="p-3">{Number(s.total_hours).toFixed(2)} h</td>
                  <td className="p-3">{Number(s.total_amount).toFixed(2)} zł</td>
                  <td className="p-3 text-gray-500">
                    {new Date(s.approved_at).toLocaleString("pl-PL")}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <a
                      href={`/admin/rozliczone/${s.id}/pdf`}
                      className="mr-3 text-blue-600 underline"
                    >
                      PDF
                    </a>
                    <a href={`/admin/rozliczone/${s.id}/excel`} className="text-blue-600 underline">
                      Excel
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
