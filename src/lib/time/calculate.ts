function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Liczy godziny pracy z HH:MM start/end. Jeśli koniec jest wcześniejszy
 * (lub równy) niż początek, zakładamy zmianę przechodzącą przez północ.
 * Równe godziny dają 0h — walidowane wyżej jako błąd (musi być > 0).
 */
export function calculateHours(startTime: string, endTime: string): number {
  const startMinutes = toMinutes(startTime);
  let endMinutes = toMinutes(endTime);
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  return (endMinutes - startMinutes) / 60;
}

export interface EarningsEntry {
  workTypeId: string;
  workTypeName: string;
  hourlyRate: number;
  hours: number;
}

export interface EarningsRow {
  workTypeId: string;
  workTypeName: string;
  hourlyRate: number;
  hours: number;
  amount: number;
}

export interface EarningsSummary {
  rows: EarningsRow[];
  totalHours: number;
  totalAmount: number;
}

export function summarizeEarnings(entries: EarningsEntry[]): EarningsSummary {
  const byWorkType = new Map<string, EarningsRow>();

  for (const entry of entries) {
    const existing = byWorkType.get(entry.workTypeId);
    if (existing) {
      existing.hours += entry.hours;
      existing.amount = round2(existing.hours * existing.hourlyRate);
    } else {
      byWorkType.set(entry.workTypeId, {
        workTypeId: entry.workTypeId,
        workTypeName: entry.workTypeName,
        hourlyRate: entry.hourlyRate,
        hours: entry.hours,
        amount: round2(entry.hours * entry.hourlyRate),
      });
    }
  }

  const rows = [...byWorkType.values()].sort((a, b) =>
    a.workTypeName.localeCompare(b.workTypeName, "pl"),
  );

  const totalHours = round2(rows.reduce((sum, r) => sum + r.hours, 0));
  const totalAmount = round2(rows.reduce((sum, r) => sum + r.amount, 0));

  return { rows, totalHours, totalAmount };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface WorkTypeTotal {
  workTypeId: string;
  workTypeName: string;
  hours: number;
  amount: number;
}

/**
 * Sumuje godziny i kwoty z już policzonych wierszy rozliczenia per rodzaj pracy.
 * Kwoty sumujemy z wierszy (a nie liczymy ponownie godziny × stawka), żeby
 * suma podsumowania zawsze zgadzała się z sumą zapisaną w rozliczeniu.
 */
export function summarizeRowsByWorkType(
  rows: { workTypeId: string; workTypeName: string; hours: number; amount: number }[],
): WorkTypeTotal[] {
  const byType = new Map<string, WorkTypeTotal>();

  for (const row of rows) {
    const existing = byType.get(row.workTypeId);
    if (existing) {
      existing.hours += row.hours;
      existing.amount += row.amount;
    } else {
      byType.set(row.workTypeId, {
        workTypeId: row.workTypeId,
        workTypeName: row.workTypeName,
        hours: row.hours,
        amount: row.amount,
      });
    }
  }

  return [...byType.values()]
    .map((t) => ({ ...t, hours: round2(t.hours), amount: round2(t.amount) }))
    .sort((a, b) => a.workTypeName.localeCompare(b.workTypeName, "pl"));
}
