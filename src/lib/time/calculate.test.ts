import { describe, expect, it } from "vitest";
import { calculateHours, summarizeEarnings } from "./calculate";

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
