import { RecordHero } from "@/components/record-window/RecordHero"
import { useLocale } from "@/hooks/useLocale"
import { formatCount, getDateTimeFormat, pluralKey } from "@/lib/intl-cache"
import { keyToDate } from "@/lib/todoInsights"
import { taskHero } from "../lib/taskHero"

const OPTS_DAY = { day: "numeric", month: "short" }
const OPTS_TIME = { hour: "2-digit", minute: "2-digit" }
const TONE = { done: "success", overdue: "warning", today: "brand", upcoming: "neutral" }

/**
 * Görevin tek sayısı: açıkken son tarihe kalan gün (gecikmede gecikme, sarı), bittiyse bitiş günü
 * ve saati, altında son tarihe göre ne zaman bittiği (yeşil). Açık ve tarihsiz görevde kart yok.
 * Gecikme durumu yalnız burada — tarih satırı sakin kalır.
 */
export function TaskHero({ task, today }) {
  const { t, locale } = useLocale()
  const model = taskHero(task, today)
  if (!model) return null
  const days = (n) => t(pluralKey("todo.detail.days", locale, n), { n: formatCount(locale, n) })

  if (model.phase === "done") {
    const { delta, doneAt, doneKey } = model
    const sub =
      delta == null
        ? null
        : delta < 0
          ? t("todo.detail.hero.early", { days: days(-delta) })
          : delta === 0
            ? t("todo.detail.hero.onTime")
            : t("todo.detail.hero.late", { days: days(delta) })
    return (
      <RecordHero
        className="td-hero"
        tone={TONE.done}
        title={t("todo.detail.hero.done")}
        sub={sub}
        value={doneKey ? getDateTimeFormat(locale, OPTS_DAY).format(keyToDate(doneKey)) : null}
        caption={doneAt ? getDateTimeFormat(locale, OPTS_TIME).format(doneAt) : null}
      />
    )
  }
  const value =
    model.phase === "today"
      ? t("todo.due.today")
      : model.phase === "upcoming" && model.days === 1
        ? t("todo.due.tomorrow")
        : days(model.days)
  return (
    <RecordHero
      className="td-hero"
      tone={TONE[model.phase]}
      title={t(model.phase === "overdue" ? "todo.detail.hero.overdue" : "todo.detail.hero.left")}
      value={value}
    />
  )
}
