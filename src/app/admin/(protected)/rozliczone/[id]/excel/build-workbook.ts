import ExcelJS from "exceljs";
import { summarizeRowsByWorkType } from "@/lib/time/calculate";
import type { SettlementDetail } from "../get-settlement";

export function buildSettlementWorkbook(settlement: SettlementDetail): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rozliczenie");

  sheet.columns = [
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 14 },
    { width: 12 },
    { width: 40 },
  ];

  sheet.addRow([`Pracownik: ${settlement.employeeName}`]);
  sheet.addRow([`Okres: ${settlement.periodFrom} – ${settlement.periodTo}`]);
  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "Data",
    "Rodzaj pracy",
    "Rozpoczęcie",
    "Zakończenie",
    "Godziny",
    "Stawka (zł/h)",
    "Kwota (zł)",
    "Opis",
  ]);
  headerRow.font = { bold: true };

  for (const row of settlement.rows) {
    sheet.addRow([
      row.workDate,
      row.workTypeName,
      row.startTime,
      row.endTime,
      row.hours,
      row.hourlyRate,
      row.amount,
      row.description.trim(),
    ]);
  }

  // Podsumowanie wg rodzaju pracy — kolumny wyrównane do tabeli powyżej
  // (rodzaj pracy = kol. B, godziny = E, kwota = G).
  sheet.addRow([]);
  sheet.addRow(["Podsumowanie wg rodzaju pracy"]).font = { bold: true };
  sheet.addRow(["", "Rodzaj pracy", "", "", "Godziny", "", "Kwota (zł)"]).font = { bold: true };

  for (const total of summarizeRowsByWorkType(settlement.rows)) {
    sheet.addRow(["", total.workTypeName, "", "", total.hours, "", total.amount]);
  }

  const totalRow = sheet.addRow([
    "",
    "Razem",
    "",
    "",
    settlement.totalHours,
    "",
    settlement.totalAmount,
  ]);
  totalRow.font = { bold: true };

  sheet.getColumn(5).numFmt = "0.00";
  sheet.getColumn(6).numFmt = "0.00";
  sheet.getColumn(7).numFmt = "0.00";
  sheet.getColumn(8).alignment = { wrapText: true, vertical: "top" };

  return workbook;
}
