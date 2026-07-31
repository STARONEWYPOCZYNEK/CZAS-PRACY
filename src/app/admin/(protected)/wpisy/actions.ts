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

const SETTLED_ERROR =
  "Wpis jest częścią zatwierdzonego rozliczenia i nie można go już zmienić";

async function assertNotSettled(entryId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("time_entries")
    .select("settlement_id")
    .eq("id", entryId)
    .maybeSingle();

  if (entry?.settlement_id) return SETTLED_ERROR;
  return null;
}

export async function adminCreateEntry(input: AdminEntryInput): Promise<ActionResult> {
  await requireAdmin();

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    employee_id: input.employeeId,
    work_type_id: input.workTypeId,
    work_date: input.workDate,
    start_time: input.startTime,
    end_time: input.endTime,
    description: input.description,
  });

  if (error) return { error: "Nie udało się dodać wpisu" };

  revalidatePath("/admin/wpisy");
  return { success: true };
}

export async function adminUpdateEntry(
  entryId: string,
  input: AdminEntryInput,
): Promise<ActionResult> {
  await requireAdmin();

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const settledError = await assertNotSettled(entryId);
  if (settledError) return { error: settledError };

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

  const settledError = await assertNotSettled(entryId);
  if (settledError) return { error: settledError };

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", entryId);

  if (error) return { error: "Nie udało się usunąć wpisu" };

  revalidatePath("/admin/wpisy");
  return { success: true };
}
