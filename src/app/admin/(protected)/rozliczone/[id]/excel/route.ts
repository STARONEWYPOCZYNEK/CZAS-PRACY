import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSettlement } from "../get-settlement";
import { buildSettlementWorkbook } from "./build-workbook";

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

  const buffer = await buildSettlementWorkbook(settlement).xlsx.writeBuffer();
  const filename = `rozliczenie-${sanitizeFilename(settlement.employeeName)}-${settlement.periodFrom}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
