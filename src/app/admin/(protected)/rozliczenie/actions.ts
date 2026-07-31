"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { calculateHours, round2 } from "@/lib/time/calculate";

type ActionResult = { error: string } | { success: true };

export async function approveSettlement(
  employeeId: string,
  periodFrom: string,
  periodTo: string,
  rateOverrides: Record<string, number>,
): Promise<ActionResult> {
  const { user, supabase } = await requireAdmin();

  if (!employeeId || !periodFrom || !periodTo) {
    return { error: "Brakuje danych rozliczenia" };
  }

  const { data: entries, error: fetchError } = await supabase
    .from("time_entries")
    .select(
      "id, work_date, start_time, end_time, description, work_type_id, work_types(name, hourly_rate)",
    )
    .eq("employee_id", employeeId)
    .gte("work_date", periodFrom)
    .lte("work_date", periodTo)
    .is("settlement_id", null)
    .order("work_date", { ascending: true });

  if (fetchError) return { error: "Nie udało się pobrać wpisów" };
  if (!entries || entries.length === 0) return { error: "Brak wpisów do rozliczenia" };

  const rows = entries.map((entry) => {
    const workType = entry.work_types as unknown as { name: string; hourly_rate: number } | null;
    const hourlyRate = rateOverrides[entry.work_type_id] ?? workType?.hourly_rate ?? 0;
    const hours = calculateHours(entry.start_time.slice(0, 5), entry.end_time.slice(0, 5));
    return {
      workDate: entry.work_date,
      workTypeId: entry.work_type_id,
      workTypeName: workType?.name ?? "—",
      startTime: entry.start_time.slice(0, 5),
      endTime: entry.end_time.slice(0, 5),
      description: entry.description,
      hours,
      hourlyRate,
      amount: round2(hours * hourlyRate),
    };
  });

  const totalHours = round2(rows.reduce((sum, r) => sum + r.hours, 0));
  const totalAmount = round2(rows.reduce((sum, r) => sum + r.amount, 0));

  const { data: settlement, error: insertError } = await supabase
    .from("settlements")
    .insert({
      employee_id: employeeId,
      period_from: periodFrom,
      period_to: periodTo,
      rows,
      total_hours: totalHours,
      total_amount: totalAmount,
      approved_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !settlement) {
    return { error: "Nie udało się zapisać rozliczenia" };
  }

  const { error: lockError } = await supabase
    .from("time_entries")
    .update({ settlement_id: settlement.id })
    .in(
      "id",
      entries.map((e) => e.id),
    );

  if (lockError) {
    return {
      error:
        "Rozliczenie zapisane, ale nie udało się zablokować wpisów. Skontaktuj się z pomocą techniczną.",
    };
  }

  revalidatePath("/admin/rozliczenie");
  revalidatePath("/admin/wpisy");
  revalidatePath("/admin/rozliczone");
  return { success: true };
}
