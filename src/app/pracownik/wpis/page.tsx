import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployeeIdFromSession } from "@/lib/employee-session/cookie";
import { isWithinEditWindow } from "@/lib/time/calculate";
import { logoutEmployee } from "../actions";
import { EntryForm } from "./entry-form";

export default async function WpisPage() {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    redirect("/pracownik");
  }

  const supabase = createAdminClient();

  const [{ data: employee }, { data: workTypes }, { data: entries }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name")
      .eq("id", employeeId)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("work_types")
      .select("id, name")
      .eq("active", true)
      .order("name"),
    supabase
      .from("time_entries")
      .select(
        "id, work_date, start_time, end_time, description, created_at, work_type_id, work_types(name)",
      )
      .eq("employee_id", employeeId)
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!employee) {
    // Konto usunięte/dezaktywowane od czasu wystawienia cookie. Cookie nie da się
    // wyczyścić bezpośrednio tutaj (Server Component), więc przekierowanie idzie
    // przez /pracownik/reset (route handler) — inaczej /pracownik widziałoby
    // wciąż "ważne" (poprawnie podpisane) cookie i odsyłało z powrotem tutaj,
    // tworząc nieskończoną pętlę przekierowań.
    redirect("/pracownik/reset");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cześć, {employee.full_name}</h1>
        <form action={logoutEmployee}>
          <button type="submit" className="text-gray-500 underline">
            Wyloguj
          </button>
        </form>
      </div>

      <EntryForm
        workTypes={workTypes ?? []}
        entries={(entries ?? []).map((e) => ({
          id: e.id,
          workDate: e.work_date,
          startTime: e.start_time,
          endTime: e.end_time,
          description: e.description,
          workTypeId: e.work_type_id,
          workTypeName: (e.work_types as unknown as { name: string } | null)?.name ?? "—",
          editable: isWithinEditWindow(e.created_at),
        }))}
      />
    </div>
  );
}
