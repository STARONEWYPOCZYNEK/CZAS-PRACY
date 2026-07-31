"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployeeIdFromSession } from "@/lib/employee-session/cookie";
import { calculateHours } from "@/lib/time/calculate";

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

export async function createEntry(input: EntryInput): Promise<ActionResult> {
  const employeeId = await getEmployeeIdFromSession();
  if (!employeeId) {
    redirect("/pracownik");
  }

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
