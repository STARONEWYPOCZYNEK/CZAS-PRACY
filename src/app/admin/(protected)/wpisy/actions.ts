"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { calculateHours } from "@/lib/time/calculate";

type ActionResult = { error: string } | { success: true };

export interface AdminEntryInput {
  employeeId: string;
  workTypeId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  description: string;
}

function validate(input: AdminEntryInput): string | null {
  if (!input.employeeId) return "Wybierz pracownika";
  if (!input.workTypeId) return "Wybierz rodzaj pracy";
  if (!input.workDate) return "Wybierz datę";
  if (calculateHours(input.startTime, input.endTime) <= 0) {
    return "Godzina zakończenia musi różnić się od rozpoczęcia";
  }
  return null;
}

export async function adminUpdateEntry(
  entryId: string,
  input: AdminEntryInput,
): Promise<ActionResult> {
  await requireAdmin();

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({
      employee_id: input.employeeId,
      work_type_id: input.workTypeId,
      work_date: input.workDate,
      start_time: input.startTime,
      end_time: input.endTime,
      description: input.description,
    })
    .eq("id", entryId);

  if (error) return { error: "Nie udało się zapisać zmian" };

  revalidatePath("/admin/wpisy");
  return { success: true };
}

export async function adminDeleteEntry(entryId: string): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", entryId);

  if (error) return { error: "Nie udało się usunąć wpisu" };

  revalidatePath("/admin/wpisy");
  return { success: true };
}
