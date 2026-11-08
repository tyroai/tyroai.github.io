import { CURRENCIES } from "@/data/hrValues"
import { getNumberFormat } from "@/lib/intl-cache"
import { asciiDigits } from "@/lib/requestForm"

/**
 * Serbest yazılmış tutar (saf): "15 bin" → 15.000, "2,5 milyon" → 2.500.000, "15000 TL" → 15.000
 * TRY, "€2.500" → 2.500 EUR, "40 usd" → 40 USD, "15 000" → 15.000. Ayraç dile göre okunur: tek
 * ayraç ve ardında tam üç rakam varsa ayraç binliktir — o ayraç dilin ONDALIK ayracıysa ("1,500"
 * Türkçede) karar verilmez, iki aday döner. Tanınmayan kelime, ikinci sayı ya da çelişen para
 * birimi → null (alan hatası gösterilir; tahminle yanlış tutar gönderilmez).
 */

const WORDS = {
  TRY: ["₺", "tl", "try", "lira", "ytl"],
  USD: ["$", "usd", "dolar", "dollar", "dollars"],
  EUR: ["€", "eur", "euro", "avro", "euros"],
  GBP: ["£", "gbp", "sterlin", "pound", "pounds"],
}
const CURRENCY_OF = new Map(
  Object.entries(WORDS).flatMap(([code, words]) => words.map((w) => [w, code])),
)
const SCALE = new Map([
  ["bin", 1e3],
  ["k", 1e3],
  ["thousand", 1e3],
  ["milyon", 1e6],
  ["mn", 1e6],
  ["m", 1e6],
  ["million", 1e6],
])

/** Dilin ondalık ayracı (Latin rakamlı biçimden). */
export function decimalSeparator(locale) {
  const parts = getNumberFormat(locale, { numberingSystem: "latn" }).formatToParts(1.5)
  return parts.find((p) => p.type === "decimal")?.value === "," ? "," : "."
}

const round2 = (n) => Math.round(n * 100) / 100

/** Ayraçlı sayı → `{ value }` ya da `{ ambiguous: [ondalık, binlik] }` ya da null. */
function readNumber(raw, decimal, scaled) {
  if (!/\d/.test(raw) || /^[.,]|[.,]$/.test(raw)) return null
  const dots = (raw.match(/\./g) ?? []).length
  const commas = (raw.match(/,/g) ?? []).length
  const num = (intPart, frac = "") => Number(`${intPart.replace(/[.,]/g, "")}.${frac || "0"}`)
  if (dots && commas) {
    const at = Math.max(raw.lastIndexOf("."), raw.lastIndexOf(","))
    return { value: num(raw.slice(0, at), raw.slice(at + 1)) }
  }
  if (!dots && !commas) return { value: Number(raw) }
  const sep = dots ? "." : ","
  if (dots + commas > 1) return { value: num(raw) }
  const [a, b] = raw.split(sep)
  // Çarpanla ("2,5 milyon") ayraç hep ondalık.
  if (scaled || b.length !== 3) return { value: num(a, b) }
  if (sep === decimal) return { ambiguous: [num(a, b), num(raw)] }
  return { value: num(raw) }
}

/**
 * `{ value, currency, ambiguous }` — `value` sayı (çarpanıyla), `currency` yazıdan okunan birim
 * ya da null, `ambiguous` iki aday (o zaman `value` null). Okunamazsa null.
 */
export function parseAmount(text, locale = "tr") {
  const s = asciiDigits(text)
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/(\d)([^\d\s.,])/g, "$1 $2")
    .replace(/([^\d\s.,])(\d)/g, "$1 $2")
  if (!s) return null
  const numbers = []
  let currency = null
  let scale = 1
  let prev = null
  for (const token of s.split(/\s+/)) {
    const isNumber = /^[\d.,]+$/.test(token)
    if (isNumber) {
      // "15 000": hemen ardından gelen üçlü grup aynı sayının devamı.
      const last = numbers.length - 1
      if (prev === "number" && /^\d{3}$/.test(token) && /^\d+$/.test(numbers[last]))
        numbers[last] += token
      else numbers.push(token)
    } else if (CURRENCY_OF.has(token) || CURRENCIES.includes(token.toUpperCase())) {
      const code = CURRENCY_OF.get(token) ?? token.toUpperCase()
      if (currency && currency !== code) return null
      currency = code
    } else if (SCALE.has(token) && scale === 1) scale = SCALE.get(token)
    else return null
    prev = isNumber ? "number" : "word"
  }
  if (numbers.length !== 1) return null
  const got = readNumber(numbers[0], decimalSeparator(locale), scale !== 1)
  if (!got) return null
  if (got.ambiguous) {
    const [x, y] = got.ambiguous.map((n) => round2(n * scale))
    return x > 0 ? { value: null, currency, ambiguous: [x, y] } : null
  }
  const value = round2(got.value * scale)
  return Number.isFinite(value) && value > 0 ? { value, currency, ambiguous: null } : null
}

/** Alana yazılan biçim: dilin ayraçlarıyla, Latin rakamla ("15.000" · "15,000" · "1.250,5"). */
export function formatAmount(value, locale = "tr") {
  return getNumberFormat(locale, {
    numberingSystem: "latn",
    maximumFractionDigits: 2,
  }).format(value)
}

/** Para birimiyle gösterim ("₺15.000,00"). */
export function formatMoney(value, currency, locale = "tr") {
  try {
    // Simge her dilde aynı (₺, €): İngilizcede "TRY 15,000.00" değil "₺15,000.00".
    return getNumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(value)
  } catch {
    return `${formatAmount(value, locale)} ${currency}`
  }
}
