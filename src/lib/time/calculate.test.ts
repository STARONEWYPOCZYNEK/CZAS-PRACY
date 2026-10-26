import { describe, expect, it } from "vitest";
import { calculateHours, summarizeEarnings, summarizeRowsByWorkType } from "./calculate";

describe("calculateHours", () => {
  it("liczy zwykłą zmianę w ciągu dnia", () => {
    expect(calculateHours("08:00", "16:00")).toBe(8);
  });

  it("liczy niepełne godziny", () => {
    expect(calculateHours("08:15", "12:45")).toBeCloseTo(4.5);
  });

  it("liczy zmianę przechodzącą przez północ", () => {
    expect(calculateHours("22:00", "06:00")).toBe(8);
  });

  it("zwraca 0 dla równych godzin (błędny wpis, walidacja wyżej)", () => {
    expect(calculateHours("09:00", "09:00")).toBe(0);
  });
});

describe("summarizeEarnings", () => {
  it("sumuje godziny i kwoty per rodzaj pracy", () => {
    const result = summarizeEarnings([
      { workTypeId: "a", workTypeName: "Mycie aut", hourlyRate: 25, hours: 8 },
      { workTypeId: "a", workTypeName: "Mycie aut", hourlyRate: 25, hours: 4 },
      { workTypeId: "b", workTypeName: "Budowa", hourlyRate: 30, hours: 6 },
    ]);

    expect(result.rows).toEqual([
      { workTypeId: "b", workTypeName: "Budowa", hourlyRate: 30, hours: 6, amount: 180 },
      { workTypeId: "a", workTypeName: "Mycie aut", hourlyRate: 25, hours: 12, amount: 300 },
    ]);
    expect(result.totalHours).toBe(18);
    expect(result.totalAmount).toBe(480);
  });

  it("zwraca puste podsumowanie dla braku wpisów", () => {
    const result = summarizeEarnings([]);
    expect(result.rows).toEqual([]);
    expect(result.totalHours).toBe(0);
    expect(result.totalAmount).toBe(0);
  });
});

describe("summarizeRowsByWorkType", () => {
  it("sumuje godziny i kwoty per rodzaj pracy, posortowane alfabetycznie", () => {
    const result = summarizeRowsByWorkType([
      { workTypeId: "z", workTypeName: "Zacisze", hours: 6, amount: 150 },
      { workTypeId: "m", workTypeName: "Myjnia", hours: 8, amount: 200 },
      { workTypeId: "m", workTypeName: "Myjnia", hours: 4.5, amount: 112.5 },
      { workTypeId: "i", workTypeName: "Inne", hours: 3.25, amount: 81.25 },
    ]);

    expect(result).toEqual([
      { workTypeId: "i", workTypeName: "Inne", hours: 3.25, amount: 81.25 },
      { workTypeId: "m", workTypeName: "Myjnia", hours: 12.5, amount: 312.5 },
      { workTypeId: "z", workTypeName: "Zacisze", hours: 6, amount: 150 },
    ]);
  });

  it("zwraca pustą listę dla braku wierszy", () => {
    expect(summarizeRowsByWorkType([])).toEqual([]);
  });
});
