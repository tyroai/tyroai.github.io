import { bcp47, getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { NAMED_IDS } from "@/lib/marketCatalog"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const OPTS_WEEKDAY = { ...OPTS_TIME, weekday: "short" }
const OPTS_DATE = { ...OPTS_TIME, day: "numeric", month: "short" }

/** Güncelleme anı: bugünse saat, bu hafta içindeyse gün ve saat, daha eskiyse tarih ve saat. */
export function stamp(at, locale) {
  const now = new Date()
  if (at.toDateString() === now.toDateString())
    return getDateTimeFormat(locale, OPTS_TIME).format(at)
  const recent = now - at < 6 * 24 * 60 * 60_000
  return getDateTimeFormat(locale, recent ? OPTS_WEEKDAY : OPTS_DATE).format(at)
}

/** Fiyat: tek birimlik kur dört ondalık (işlem dili), çok birimlik kur ve altın/endeks iki. */
export function price(row, locale) {
  const digits = row.kind === "fx" && !row.unit ? 4 : 2
  return getNumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(row.value)
}

const currencyNames = new Map()
export function currencyName(code, locale) {
  if (!currencyNames.has(locale)) {
    let dn = null
    try {
      dn = new Intl.DisplayNames([bcp47(locale)], { type: "currency" })
    } catch {
      // Eski tarayıcı: kod yeter.
    }
    currencyNames.set(locale, dn)
  }
  return currencyNames.get(locale)?.of(code) ?? code
}

/**
 * Satırın adı: `short` kartta (sözlükteki ad ya da "100 KZT"), `long` ipucunda ve ekran okuyucuda
 * ("Kazakistan tengesi"), `tiny` dar kartta — header tepsisindeki gibi kur ISO koduyla ("USD"),
 * altın ve endeks kısa adıyla ("Gram", "BIST"): uzun dillerde "Доллар" "Дол…" oluyordu.
 */
export function rowNames(row, t, locale) {
  if (NAMED_IDS.has(row.id)) {
    const name = t(`widgets.market.row.${row.id}`)
    const tiny = row.kind === "fx" ? row.id.toUpperCase() : t(`headerWidgets.marketShort.${row.id}`)
    return { short: name, long: name, tiny }
  }
  const code = row.id.toUpperCase()
  const short = row.unit ? `${row.unit} ${code}` : code
  return { short, long: currencyName(code, locale), tiny: short }
}
