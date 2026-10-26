import { existsSync } from "fs";
import path from "path";
import { Document, Page, Text, View, Font, StyleSheet } from "@react-pdf/renderer";
import { summarizeRowsByWorkType } from "@/lib/time/calculate";
import type { SettlementDetail } from "../get-settlement";

// Domyślna czcionka PDF (Helvetica) nie ma polskich liter (ł, ą, ę, ś, ć, ń, ź, ż),
// więc opisy i „zł” wychodziły z błędami. Roboto ma pełny zestaw znaków.
// Pliki .ttf są dołączane do funkcji przez outputFileTracingIncludes w next.config.ts.
const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");
const REGULAR_FONT = path.join(FONT_DIR, "Roboto-Regular.ttf");
const BOLD_FONT = path.join(FONT_DIR, "Roboto-Bold.ttf");

// Gdyby plików czcionek zabrakło w środowisku, raport nadal ma się wygenerować
// (z domyślną czcionką, bez polskich liter) zamiast zwracać błąd 500.
const hasCustomFont = existsSync(REGULAR_FONT) && existsSync(BOLD_FONT);

if (hasCustomFont) {
  Font.register({
    family: "Roboto",
    fonts: [
      { src: REGULAR_FONT, fontWeight: 400 },
      { src: BOLD_FONT, fontWeight: 700 },
    ],
  });
}

// Domyślne dzielenie wyrazów używa reguł angielskich i łamie polskie słowa
// w przypadkowych miejscach — wyłączamy, tekst zawija się tylko między wyrazami.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: hasCustomFont ? "Roboto" : "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 14 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 5,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 5,
  },
  cellDate: { width: "11%", paddingRight: 4 },
  cellWork: { width: "13%", paddingRight: 4 },
  cellTime: { width: "14%", paddingRight: 4 },
  cellHours: { width: "9%", paddingRight: 4 },
  cellRate: { width: "11%", paddingRight: 4 },
  cellAmount: { width: "11%", paddingRight: 8, textAlign: "right" },
  cellDesc: { width: "31%" },
  summaryTitle: { marginTop: 22, marginBottom: 6, fontSize: 12, fontWeight: 700 },
  summaryTable: { width: "55%" },
  summaryHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 4,
    fontWeight: 700,
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
  },
  summaryTotalRow: {
    flexDirection: "row",
    borderTopWidth: 2,
    borderTopColor: "#333",
    paddingTop: 5,
    marginTop: 2,
    fontSize: 11,
    fontWeight: 700,
  },
  summaryName: { width: "40%" },
  summaryHours: { width: "30%", textAlign: "right" },
  summaryAmount: { width: "30%", textAlign: "right" },
  footer: { marginTop: 24, fontSize: 8, color: "#888" },
});

export function SettlementPdf({ settlement }: { settlement: SettlementDetail }) {
  const totalsByType = summarizeRowsByWorkType(settlement.rows);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rozliczenie — {settlement.employeeName}</Text>
        <Text style={styles.subtitle}>
          Okres: {settlement.periodFrom} – {settlement.periodTo} · Zatwierdzono:{" "}
          {new Date(settlement.approvedAt).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}
        </Text>

        <View style={styles.headerRow}>
          <Text style={styles.cellDate}>Data</Text>
          <Text style={styles.cellWork}>Rodzaj pracy</Text>
          <Text style={styles.cellTime}>Godziny</Text>
          <Text style={styles.cellHours}>Suma</Text>
          <Text style={styles.cellRate}>Stawka</Text>
          <Text style={styles.cellAmount}>Kwota</Text>
          <Text style={styles.cellDesc}>Opis</Text>
        </View>

        {settlement.rows.map((row, i) => (
          <View style={styles.row} key={i} wrap={false}>
            <Text style={styles.cellDate}>{row.workDate}</Text>
            <Text style={styles.cellWork}>{row.workTypeName}</Text>
            <Text style={styles.cellTime}>
              {row.startTime}–{row.endTime}
            </Text>
            <Text style={styles.cellHours}>{row.hours.toFixed(2)} h</Text>
            <Text style={styles.cellRate}>{row.hourlyRate.toFixed(2)} zł/h</Text>
            <Text style={styles.cellAmount}>{row.amount.toFixed(2)} zł</Text>
            <Text style={styles.cellDesc}>{row.description.trim()}</Text>
          </View>
        ))}

        <View wrap={false}>
          <Text style={styles.summaryTitle}>Podsumowanie wg rodzaju pracy</Text>
          <View style={styles.summaryTable}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryName}>Rodzaj pracy</Text>
              <Text style={styles.summaryHours}>Godziny</Text>
              <Text style={styles.summaryAmount}>Kwota</Text>
            </View>
            {totalsByType.map((t) => (
              <View style={styles.summaryRow} key={t.workTypeId}>
                <Text style={styles.summaryName}>{t.workTypeName}</Text>
                <Text style={styles.summaryHours}>{t.hours.toFixed(2)} h</Text>
                <Text style={styles.summaryAmount}>{t.amount.toFixed(2)} zł</Text>
              </View>
            ))}
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryName}>Razem</Text>
              <Text style={styles.summaryHours}>{settlement.totalHours.toFixed(2)} h</Text>
              <Text style={styles.summaryAmount}>{settlement.totalAmount.toFixed(2)} zł</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Ewidencja godzin pracy — wygenerowano automatycznie.</Text>
      </Page>
    </Document>
  );
}
