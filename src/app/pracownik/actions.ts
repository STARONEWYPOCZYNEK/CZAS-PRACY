"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { setEmployeeSession, clearEmployeeSession } from "@/lib/employee-session/cookie";
import { verifyPinHash } from "@/lib/employee-session/pin";
import { checkPinRateLimit, recordPinAttempt } from "@/lib/rate-limit/pin-attempts";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export async function loginWithPin(
  employeeId: string,
  pin: string,
): Promise<{ error: string } | never> {
  if (!/^\d{4}$/.test(pin)) {
    return { error: "PIN musi mieć 4 cyfry" };
  }

  const ip = await getClientIp();

  const rateLimit = await checkPinRateLimit(employeeId, ip);
  if (!rateLimit.allowed) {
    return { error: rateLimit.reason! };
  }

  const supabase = createAdminClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("id, pin_hash, active")
    .eq("id", employeeId)
    .maybeSingle();

  if (!employee || !employee.active) {
    await recordPinAttempt(employeeId, ip, false);
    return { error: "Nieprawidłowy PIN" };
  }

  const valid = await verifyPinHash(pin, employee.pin_hash);
  await recordPinAttempt(employeeId, ip, valid);

  if (!valid) {
    return { error: "Nieprawidłowy PIN" };
  }

  await setEmployeeSession(employee.id);
  redirect("/pracownik/wpis");
}

export async function logoutEmployee(): Promise<void> {
  await clearEmployeeSession();
  redirect("/pracownik");
}
