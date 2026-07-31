import { NextResponse, type NextRequest } from "next/server";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSettlement } from "../get-settlement";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#555", marginBottom: 16 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 6 },
  headerRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#333", paddingBottom: 6, fontWeight: 700 },
  cellWork: { width: "35%" },
  cellRate: { width: "20%" },
  cellHours: { width: "20%" },
  cellAmount: { width: "25%", textAlign: "right" },
  total: { marginTop: 16, fontSize: 14, fontWeight: 700, textAlign: "right" },
  footer: { marginTop: 24, fontSize: 9, color: "#888" },
});

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

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rozliczenie — {settlement.employeeName}</Text>
        <Text style={styles.subtitle}>
          Okres: {settlement.periodFrom} – {settlement.periodTo} · Zatwierdzono:{" "}
          {new Date(settlement.approvedAt).toLocaleString("pl-PL")}
        </Text>

        <View style={styles.headerRow}>
          <Text style={styles.cellWork}>Rodzaj pracy</Text>
          <Text style={styles.cellRate}>Stawka</Text>
          <Text style={styles.cellHours}>Godziny</Text>
          <Text style={styles.cellAmount}>Kwota</Text>
        </View>

        {settlement.rows.map((row) => (
          <View style={styles.row} key={row.workTypeId}>
            <Text style={styles.cellWork}>{row.workTypeName}</Text>
            <Text style={styles.cellRate}>{row.hourlyRate.toFixed(2)} zł/h</Text>
            <Text style={styles.cellHours}>{row.hours.toFixed(2)} h</Text>
            <Text style={styles.cellAmount}>{row.amount.toFixed(2)} zł</Text>
          </View>
        ))}

        <Text style={styles.total}>
          Razem: {settlement.totalHours.toFixed(2)} h — {settlement.totalAmount.toFixed(2)} zł
        </Text>

        <Text style={styles.footer}>Ewidencja godzin pracy — wygenerowano automatycznie.</Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  const filename = `rozliczenie-${sanitizeFilename(settlement.employeeName)}-${settlement.periodFrom}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
