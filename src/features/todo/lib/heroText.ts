// Karşılamanın iki satırı (başlık + alt satır): kart ve telefon şeridi aynı cümleyi söyler.

type Translate = (key: string, vars?: Record<string, unknown>) => string

interface HeroSummary {
  focusOpen: unknown[]
  focusDone: number
  focusTotal: number
  overdue: unknown[]
}

const PLURAL = new Set(["zero", "one", "two", "few", "many", "other"])

/** Hazır panonun cümlesi; pano hazır değilse çağırmayın (durum metni çağıranda). */
export function heroLines(
  t: Translate,
  plural: Intl.PluralRules,
  summary: HeroSummary,
): { headline: string; sub: string } {
  const open = summary.focusOpen.length
  if (open) {
    const cat = plural.select(open)
    const parts: string[] = []
    if (summary.overdue.length) parts.push(t("todo.hero.overdue", { n: summary.overdue.length }))
    if (summary.focusDone) parts.push(t("todo.hero.doneSoFar", { n: summary.focusDone }))
    return {
      headline: t(`todo.hero.open.${PLURAL.has(cat) ? cat : "other"}`, { n: open }),
      sub: parts.join(" · ") || t("todo.hero.goodLuck"),
    }
  }
  if (summary.focusTotal)
    return {
      headline: t("todo.hero.allDone"),
      sub: t("todo.hero.allDoneSub", { n: summary.focusDone }),
    }
  return { headline: t("todo.hero.empty"), sub: t("todo.hero.emptySub") }
}
