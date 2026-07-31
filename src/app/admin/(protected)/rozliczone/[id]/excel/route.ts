import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSettlement } from "../get-settlement";

function sanitizeFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;
  const settlement = await getSettlement(id);

  if (!settlement) {
    return new NextResponse("Nie znaleziono rozliczenia", { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rozliczenie");

  sheet.columns = [
    { width: 12 },
    { width: 18 },
    { width: 10 },
    { width: 10 },
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
      row.description,
    ]);
  }

  sheet.addRow([]);
  const totalRow = sheet.addRow(["Razem", "", "", "", settlement.totalHours, "", settlement.totalAmount]);
  totalRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `rozliczenie-${sanitizeFilename(settlement.employeeName)}-${settlement.periodFrom}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
