import { parseAmount } from "@/lib/amountParse"
import { stem } from "./text"

/**
 * Anlat'ın tutar okuyucusu (saf): yazıdaki tutar adayları (sayı + para birimi + çarpan dizileri,
 * `parseAmount`) ve asıl tutarın seçimi — para birimi yazılan aday, yoksa en büyüğü ("3 gece otel
 * 4500" → 4500; "2 kişi 1500" → 1500). Birimin eki atılır ("liralık", "dolarlık"). Plaka
 * ("34abc123"), kâğıt boyu ("a4") ve fuar/kongre yılı ("Anuga 2027 fuarı") tutar değildir.
 */
const CURRENCY_WORDS = [
  "tl",
  "try",
  "lira",
  "ytl",
  "usd",
  "dolar",
  "eur",
  "euro",
  "avro",
  "gbp",
  "sterlin",
]
const SCALES = ["bin", "milyon", "k", "m"]

function amountToken(token) {
  if (/^[€$£₺]?\d[\d.,]*[€$£₺]?$/.test(token) || /^[€$£₺]$/.test(token)) return token
  if (SCALES.includes(token)) return token
  return CURRENCY_WORDS.find((w) => stem(token, w, 4)) ?? null
}

/** Yazıdaki tutar adayları, sırayla: `{ value, currency, ambiguous }`. */
// Plaka ("34abc123") ve kâğıt boyu ("a4"); "taksi450" ise bitişik yazılmış tutar.
const CODE = /\b\d+[a-z]+\d[a-z0-9]*\b|\b[a-z]{1,2}\d\b/g
const YEAR = /^(?:19|20)\d\d$/
const YEAR_WORD = /^(?:fuar|kongre|yil|sezon|model|expo|zirve)/

export function readAmounts(text, locale = "tr") {
  const tokens = text
    .replace(CODE, " ")
    .replace(/(\d)([^\d\s.,])/g, "$1 $2")
    .replace(/([^\d\s.,])(\d)/g, "$1 $2")
    .split(/\s+/)
    .map((t) => t.replace(/^[,.;:!?(]+|[,.;:!?)]+$/g, ""))
  const out = []
  let run = []
  for (const t of [...tokens, ""]) {
    const part = t && amountToken(t)
    if (part) {
      run.push(part)
      continue
    }
    const year = run.length === 1 && YEAR.test(run[0]) && YEAR_WORD.test(t)
    if (!year && run.some((x) => /\d/.test(x))) {
      const got = parseAmount(run.join(" "), locale)
      if (got) out.push(got)
    }
    run = []
  }
  return out
}

/** Asıl tutar: birimi yazılan, yoksa en büyük; yalnız iki anlamlı aday varsa o. */
export function pickAmount(list) {
  const sure = list.filter((a) => a.value)
  if (!sure.length) return list[0] ?? null
  return sure.find((a) => a.currency) ?? sure.reduce((a, b) => (b.value > a.value ? b : a))
}
