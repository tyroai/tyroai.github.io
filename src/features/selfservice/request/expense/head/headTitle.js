import { number } from "../../../kinds"

/** Masraf açıklamasının sınırı (ERP başlığı) ve sayacın göründüğü yer. */
export const TITLE_MAX = 120
// Sınıra bu kadar harf kala sayaç görünür.
const COUNT_FROM = TITLE_MAX - 20

/** "101/120" — sınıra yaklaşınca; uzaktaysa `null`. `full`: sınırda (uyarı tonu). */
export function titleCount(t, locale, title) {
  const n = title.length
  if (n < COUNT_FROM) return null
  return {
    text: t("selfService.expense.head.titleCount", {
      n: number(n, locale),
      max: number(TITLE_MAX, locale),
    }),
    full: n >= TITLE_MAX,
  }
}
