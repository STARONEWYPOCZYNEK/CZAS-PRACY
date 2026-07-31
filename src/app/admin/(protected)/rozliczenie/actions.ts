"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { round2 } from "@/lib/time/calculate";

type ActionResult = { error: string } | { success: true };

export interface SettlementRowInput {
  workTypeId: string;
  workTypeName: string;
  hourlyRate: number;
  hours: number;
  amount: number;
}

export async function approveSettlement(
  employeeId: string,
  periodFrom: string,
  periodTo: string,
  rows: SettlementRowInput[],
): Promise<ActionResult> {
  const { user, supabase } = await requireAdmin();

  if (!employeeId || !periodFrom || !periodTo) {
    return { error: "Brakuje danych rozliczenia" };
  }
  if (rows.length === 0) {
    return { error: "Brak wpisów do rozliczenia" };
  }

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
    .eq("employee_id", employeeId)
    .gte("work_date", periodFrom)
    .lte("work_date", periodTo)
    .is("settlement_id", null);

  if (lockError) {
    return { error: "Rozliczenie zapisane, ale nie udało się zablokować wpisów. Skontaktuj się z pomocą techniczną." };
  }

  revalidatePath("/admin/rozliczenie");
  revalidatePath("/admin/wpisy");
  revalidatePath("/admin/rozliczone");
  return { success: true };
}
