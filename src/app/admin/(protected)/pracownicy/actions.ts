"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { hashPin } from "@/lib/employee-session/pin";

type ActionResult = { error: string } | { success: true };

function validatePin(pin: string): string | null {
  if (!/^\d{4}$/.test(pin)) return "PIN musi mieć dokładnie 4 cyfry";
  return null;
}

export async function addEmployee(fullName: string, pin: string): Promise<ActionResult> {
  await requireAdmin();

  if (!fullName.trim()) return { error: "Podaj imię i nazwisko" };
  const pinError = validatePin(pin);
  if (pinError) return { error: pinError };

  const pinHash = await hashPin(pin);
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .insert({ full_name: fullName.trim(), pin_hash: pinHash });

  if (error) return { error: "Nie udało się dodać pracownika" };

  revalidatePath("/admin/pracownicy");
  return { success: true };
}

export async function setEmployeeActive(employeeId: string, active: boolean): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("employees").update({ active }).eq("id", employeeId);

  if (error) return { error: "Nie udało się zmienić statusu" };

  revalidatePath("/admin/pracownicy");
  return { success: true };
}

export async function resetEmployeePin(employeeId: string, newPin: string): Promise<ActionResult> {
  await requireAdmin();

  const pinError = validatePin(newPin);
  if (pinError) return { error: pinError };

  const pinHash = await hashPin(newPin);
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ pin_hash: pinHash })
    .eq("id", employeeId);

  if (error) return { error: "Nie udało się zresetować PIN-u" };

  revalidatePath("/admin/pracownicy");
  return { success: true };
}
