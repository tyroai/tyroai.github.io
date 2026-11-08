import { upcomingLeave } from "@/lib/selfServiceAlerts"
import { inYear } from "@/lib/selfServiceModel"
import {
  advanceReport,
  breakdown,
  byCategory,
  expenseReport,
  leaveReport,
  totalsOf,
} from "@/lib/selfServiceReport"
import { totalsList } from "../kinds"

/** Ayrıntıda gösterilen izin türü sayısı (raporun "Türe göre" sırasıyla, en büyükler). */
const TOP_TYPES = 3

/** Ayrıntıda gösterilen kategori / avans türü sayısı (en büyükler). */
const TOP_MIX = 5
const allLines = (reports) =>
  reports.flatMap((r) => (r.lines ?? []).map((l) => ({ ...l, report: r.number })))
const PURPOSE = {
  keyOf: (r) => r.purposeKey || r.purpose,
  labelOf: (r) => r.purposeName || r.purpose,
  totalsOf,
}

/**
 * Para kutusunun ayrıntısı — raporun kırılımlarıyla birebir (`expenseReport` / `advanceReport`):
 * toplama girenlerin para birimine göre toplamı, kategoriye (kalem) ya da avans türüne göre ilk
 * beş (tutar + sayı) ve duruma göre HER kayıt (sayı + tutar; toplam dışılar işaretli). Toplama
 * giren kayıt yoksa (ör. hepsi gönderilmemiş) kırılım toplam dışılardan: kart yine bir şey söyler.
 */
function moneyFacts(kind, records, part) {
  const report = kind === "expense" ? expenseReport(records) : advanceReport(records)
  let mix = kind === "expense" ? report.byCategory : report.byPurpose
  let mixExcluded = false
  if (!mix.rows.length && records.length) {
    mix = kind === "expense" ? byCategory(allLines(records)) : breakdown(records, PURPOSE)
    mixExcluded = true
  }
  return {
    all: records.length,
    totals: totalsList(part?.totals),
    mix: mix.rows.slice(0, TOP_MIX),
    mixCurrency: mix.currency,
    mixExcluded,
    statuses: report.byStatus.rows,
    statusCurrency: report.byStatus.currency,
  }
}

/**
 * Özet kutularının hover/çekmece ayrıntısı (saf). Girdi: adlı veri, `summarize(data, year)`
 * ve dönem. İzin: sıradaki izin (`upcomingLeave`, uyarıyla aynı kural) ve dönemin türe göre
 * ilk üçü (`leaveReport`, raporla aynı kırılım); bakiye ve hak ediş çağıranda.
 */
export function tileFacts(data, summary, year, now = new Date()) {
  return {
    leave: {
      next: upcomingLeave(data?.leaves, now),
      types: leaveReport(data?.leaves, year)
        .byType.rows.filter((r) => r.count)
        .slice(0, TOP_TYPES),
    },
    expense: moneyFacts("expense", inYear(data?.expenses ?? [], year), summary?.expense),
    advance: moneyFacts("advance", inYear(data?.advances ?? [], year), summary?.advance),
  }
}
