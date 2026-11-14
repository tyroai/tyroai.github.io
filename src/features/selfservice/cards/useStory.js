import { useMemo } from "react"
import FilterIcon from "@hugeicons/core-free-icons/FilterIcon"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"
import { useLocale } from "@/hooks/useLocale"
import { countText, day, number } from "../kinds"
import { storyFacts, storyFocus, storyLines } from "../lib/storyFacts"

/**
 * TYRO özetinin içeriği (Kartlar düzeni, Bilgilerim): seçili dönemin kayıtlarından kurulan birkaç
 * cümle — önce iş bekleyenler, sonra kalan izin ve sonraki hak ediş (`lib/storyFacts`) — ve en çok
 * üç eylem: bekleyenleri listede göster, izin talebi oluştur, TYRO'ya özet sor. Sayılar listedekiyle
 * aynı kaynaktan; cümle model üretimi değil. Geniş ekranda kart (`StoryCard`), telefonda tek satır
 * + çekmece (`StoryPhone`) aynı içeriği çizer.
 */
export function useStory({ data, year, balance, accrual, onFocus, onNew, onAsk }) {
  const { t, locale } = useLocale()
  const facts = useMemo(() => storyFacts(data, year), [data, year])
  const remain = balance?.remain ?? null
  const focus = storyFocus(facts)
  const text = (line) => {
    switch (line.id) {
      case "balance":
        return t("selfService.story.balance", {
          days: countText(t, locale, "selfService.days", remain),
        })
      case "accrual":
        return t("selfService.story.accrual", {
          date: day(accrual.date, locale, false),
          n: number(accrual.days, locale),
        })
      case "records":
        return year == null
          ? t("selfService.story.recordsAll", { n: number(line.n, locale) })
          : t("selfService.story.records", { year, n: number(line.n, locale) })
      default:
        return t(`selfService.story.${line.id}`, { n: number(line.n ?? 0, locale) })
    }
  }
  return {
    eyebrow: t("selfService.story.title", { period: year ?? t("selfService.tile.allYears") }),
    lines: storyLines(facts, { hasBalance: remain != null, hasAccrual: Boolean(accrual) }).map(
      (line) => ({ id: line.id, text: text(line) }),
    ),
    actions: [
      // Bekleyen iş varsa ilk düğme ana eylem (paletin rampasında).
      focus && {
        id: "focus",
        main: true,
        icon: FilterIcon,
        label: t(`selfService.story.show.${focus.id}`),
        run: () => onFocus(focus),
      },
      onNew && { id: "new", label: t("selfService.story.newLeave"), run: () => onNew("leave") },
      {
        id: "ask",
        icon: SparklesIcon,
        label: t("selfService.story.ask"),
        run: () => onAsk(t("selfService.story.askQuestion")),
      },
    ].filter(Boolean),
  }
}
