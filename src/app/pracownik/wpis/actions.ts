"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployeeIdFromSession } from "@/lib/employee-session/cookie";
import { calculateHours } from "@/lib/time/calculate";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface EntryInput {
  workDate: string;
  workTypeId: string;
  startTime: string;
  endTime: string;
  description: string;
}

type ActionResult = { error: string } | { success: true };

function validateEntry(input: EntryInput): string | null {
  if (!input.workDate) return "Wybierz datę";
  if (!input.workTypeId) return "Wybierz rodzaj pracy";
  if (!input.startTime || !input.endTime) return "Podaj godzinę rozpoczęcia i zakończenia";
  if (calculateHours(input.startTime, input.endTime) <= 0) {
    return "Godzina zakończenia musi różnić się od rozpoczęcia";
  }
  return null;
}

async function requireEmployeeId(): Promise<string> {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    redirect("/pracownik");
  }
  return employeeId;
}

export async function createEntry(input: EntryInput): Promise<ActionResult> {
  const employeeId = await requireEmployeeId();

  const validationError = validateEntry(input);
  if (validationError) return { error: validationError };

  const supabase = createAdminClient();
  const { error } = await supabase.from("time_entries").insert({
    employee_id: employeeId,
    work_type_id: input.workTypeId,
    work_date: input.workDate,
    start_time: input.startTime,
    end_time: input.endTime,
    description: input.description,
  });

  if (error) return { error: "Nie udało się zapisać wpisu" };

  revalidatePath("/pracownik/wpis");
  return { success: true };
}

async function loadOwnRecentEntry(entryId: string, employeeId: string) {
  const supabase = createAdminClient();
  const { data: entry } = await supabase
    .from("time_entries")
    .select("id, employee_id, created_at")
    .eq("id", entryId)
    .maybeSingle();

  if (!entry || entry.employee_id !== employeeId) return null;

  const ageMs = Date.now() - new Date(entry.created_at).getTime();
  if (ageMs > EDIT_WINDOW_MS) return null;

  return entry;
}

export async function updateEntry(
  entryId: string,
  input: EntryInput,
): Promise<ActionResult> {
  const employeeId = await requireEmployeeId();

  const validationError = validateEntry(input);
  if (validationError) return { error: validationError };

  const entry = await loadOwnRecentEntry(entryId, employeeId);
  if (!entry) {
    return { error: "Ten wpis można edytować tylko w ciągu 24h od dodania" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("time_entries")
    .update({
      work_type_id: input.workTypeId,
      work_date: input.workDate,
      start_time: input.startTime,
      end_time: input.endTime,
      description: input.description,
    })
    .eq("id", entryId);

  if (error) return { error: "Nie udało się zapisać zmian" };

  revalidatePath("/pracownik/wpis");
  return { success: true };
}

export async function deleteEntry(entryId: string): Promise<ActionResult> {
  const employeeId = await requireEmployeeId();

  const entry = await loadOwnRecentEntry(entryId, employeeId);
  if (!entry) {
    return { error: "Ten wpis można usunąć tylko w ciągu 24h od dodania" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", entryId);

  if (error) return { error: "Nie udało się usunąć wpisu" };

  revalidatePath("/pracownik/wpis");
  return { success: true };
}
