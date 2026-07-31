"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";

type ActionResult = { error: string } | { success: true };

export async function addWorkType(name: string, hourlyRate: number): Promise<ActionResult> {
  await requireAdmin();

  if (!name.trim()) return { error: "Podaj nazwę rodzaju pracy" };
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
    return { error: "Podaj poprawną stawkę PLN/h" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_types")
    .insert({ name: name.trim(), hourly_rate: hourlyRate });

  if (error) return { error: "Nie udało się dodać rodzaju pracy" };

  revalidatePath("/admin/rodzaje-pracy");
  return { success: true };
}

export async function updateWorkTypeRate(
  workTypeId: string,
  hourlyRate: number,
): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
    return { error: "Podaj poprawną stawkę PLN/h" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("work_types")
    .update({ hourly_rate: hourlyRate })
    .eq("id", workTypeId);

  if (error) return { error: "Nie udało się zapisać stawki" };

  revalidatePath("/admin/rodzaje-pracy");
  return { success: true };
}

export async function setWorkTypeActive(workTypeId: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("work_types").update({ active }).eq("id", workTypeId);

  if (error) return { error: "Nie udało się zmienić statusu" };

  revalidatePath("/admin/rodzaje-pracy");
  return { success: true };
}
