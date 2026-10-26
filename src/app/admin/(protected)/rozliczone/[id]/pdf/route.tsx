import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSettlement } from "../get-settlement";
import { SettlementPdf } from "./settlement-pdf";

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

  const buffer = await renderToBuffer(<SettlementPdf settlement={settlement} />);
  const filename = `rozliczenie-${sanitizeFilename(settlement.employeeName)}-${settlement.periodFrom}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
