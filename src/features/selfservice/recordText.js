import "@/lib/i18n/selfService"
import { countText, day, money, number, range, totalsList } from "./kinds"

/**
 * Kaydın satırdaki parçaları: başlık, alt satır, sağdaki değer; masrafta `amounts` para
 * birimlerinin tutarları ayrı ayrı (telefonda alt alta, değer onların " + " ile birleşimi).
 */
export function describe(record, t, locale) {
  if (record.kind === "leave") {
    const amount =
      record.days != null && record.days > 0
        ? countText(t, locale, "selfService.days", record.days)
        : record.hours != null
          ? t("selfService.hours", { n: number(record.hours, locale) })
          : ""
    return {
      title: record.typeName || record.type || t("selfService.leave.untitled"),
      sub: range(record.start, record.end, locale),
      value: amount,
    }
  }
  if (record.kind === "expense") {
    const amounts = totalsList(record.totals).map(([c, a]) => money(a, c, locale))
    const names = record.categoryNames ?? record.categories ?? []
    return {
      title: names.length
        ? names.slice(0, 2).join(" · ") + (names.length > 2 ? " …" : "")
        : t("selfService.expense.untitled"),
      sub: [
        record.number,
        day(record.date, locale),
        countText(t, locale, "selfService.expense.lines", record.lines.length),
      ].join(" · "),
      value: amounts.join(" + ") || "—",
      amounts,
    }
  }
  return {
    title: record.purposeName || record.purpose || t("selfService.advance.untitled"),
    sub: [record.number, day(record.date, locale), record.location].filter(Boolean).join(" · "),
    value: money(record.amount, record.currency, locale),
  }
}

/** Kaydın kalıcı adresi — sohbet bu adresle referans verir (`?tab=…&ref=…`). */
export function recordLink(record) {
  const url = new URL("/self-service", window.location.origin)
  url.searchParams.set("tab", record.kind)
  url.searchParams.set("ref", record.id)
  return url.toString()
}

/** Kayıt için sohbete giden soru: kişi ERP'ye gitmeden asistandan durumu ve ayrıntıyı ister. */
export function recordQuestion(record, t, locale) {
  if (record.kind === "leave") {
    return t("selfService.ask.leave", {
      type: record.typeName || record.type || t("selfService.leave.untitled"),
      range: range(record.start, record.end, locale),
    })
  }
  if (record.kind === "expense") return t("selfService.ask.expense", { number: record.number })
  return t("selfService.ask.advance", { number: record.number, date: day(record.date, locale) })
}
