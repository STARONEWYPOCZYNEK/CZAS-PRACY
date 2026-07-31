import { createClient } from "@/lib/supabase/server";

export interface SettlementRow {
  workDate: string;
  workTypeId: string;
  workTypeName: string;
  startTime: string;
  endTime: string;
  description: string;
  hourlyRate: number;
  hours: number;
  amount: number;
}

export interface SettlementDetail {
  id: string;
  employeeName: string;
  periodFrom: string;
  periodTo: string;
  rows: SettlementRow[];
  totalHours: number;
  totalAmount: number;
  approvedAt: string;
}

export async function getSettlement(id: string): Promise<SettlementDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlements")
    .select(
      "id, period_from, period_to, rows, total_hours, total_amount, approved_at, employees(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    employeeName: (data.employees as unknown as { full_name: string } | null)?.full_name ?? "—",
    periodFrom: data.period_from,
    periodTo: data.period_to,
    rows: data.rows as unknown as SettlementRow[],
    totalHours: Number(data.total_hours),
    totalAmount: Number(data.total_amount),
    approvedAt: data.approved_at,
  };
}
