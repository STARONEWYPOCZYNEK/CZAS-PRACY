import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_EMPLOYEE = 5;
const MAX_ATTEMPTS_PER_IP = 20;

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

export async function checkPinRateLimit(
  employeeId: string,
  ipAddress: string,
): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count: employeeFailures } = await supabase
    .from("pin_attempts")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .eq("success", false)
    .gte("attempted_at", since);

  if ((employeeFailures ?? 0) >= MAX_ATTEMPTS_PER_EMPLOYEE) {
    return {
      allowed: false,
      reason: `Zbyt wiele nieudanych prób. Spróbuj ponownie za ${WINDOW_MINUTES} minut lub poproś administratora o reset PIN-u.`,
    };
  }

  const { count: ipFailures } = await supabase
    .from("pin_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .eq("success", false)
    .gte("attempted_at", since);

  if ((ipFailures ?? 0) >= MAX_ATTEMPTS_PER_IP) {
    return {
      allowed: false,
      reason: `Zbyt wiele nieudanych prób z tego urządzenia. Spróbuj ponownie za ${WINDOW_MINUTES} minut.`,
    };
  }

  return { allowed: true };
}

export async function recordPinAttempt(
  employeeId: string,
  ipAddress: string,
  success: boolean,
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("pin_attempts")
    .insert({ employee_id: employeeId, ip_address: ipAddress, success });
}
