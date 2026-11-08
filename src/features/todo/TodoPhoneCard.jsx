import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { useHeroInk } from "@/hooks/useGradientInk"
import { useLocale } from "@/hooks/useLocale"
import { HERO_INK, HERO_SHADE } from "@/lib/gradientInk"
import { dueLabel, periodProgress } from "@/lib/todoInsights"
import { cn } from "@/lib/utils"
import { firstDayOfWeek } from "@/lib/weekStart"
import { ChecklistOrb } from "./ChecklistOrb"
import { useTitleFit } from "./hooks/useTitleFit"
import { MiniRing } from "./TodoKpiBar"
import { TodoStatusSheet } from "./TodoStatusTray"
import { heroLines } from "./lib/heroText"
import { plannedTasks } from "./statusTones"
import "./todoPhoneCard.css"

// Kısa gün adı: sıradaki iş yazısına yer kalsın (listedeki "27 Eki Sal" gibi).

/** Cam şeridin dört hücresi: tepsinin dört durumu, aynı etiket ve aynı sayı (`summary`). */
const CELLS = [
  { key: "overdue", label: "todo.kpi.overdue" },
  { key: "important", label: "todo.kpi.important" },
  { key: "planned", label: "todo.view.planned" },
  { key: "done", label: "todo.view.done" },
]

/**
 * TELEFONDA KARTIN YERİ — Self Servis'in telefon kartıyla AYNI kabuk, boy ve satır ritmi
 * (`todoPhoneCard.css`): üstte maskot · günün cümlesi · bugünün yüzdesi, ortada tarih ve sıradaki
 * planlı iş, altta dört durumun cam şeridi (gecikmiş · önemli · planlanan · tamamlanan). Bilgiler
 * masaüstü kartın zaten gösterdikleri: yeni veri ya da alan yok. Kartın tamamı tek düğme,
 * dokununca durum çekmecesi (ilerleme + dört durum, bir duruma basınca liste o görünüme geçer)
 * açılır. Gradyan ve mürekkep kartınkiyle aynı (`useHeroInk`); halka düz kart üstünde (küçük
 * rakam). Boyun Self Servis'inkiyle eşitliği `tests/e2e/heroParity.spec.js`te.
 */
export function TodoPhoneCard({ board, summary, today, celebrate, busy, onView }) {
  const { t, locale } = useLocale()
  const { ink, shade } = useHeroInk()
  const [sheet, setSheet] = useState(false)
  const titleRef = useRef(null)
  const plural = useMemo(() => new Intl.PluralRules(locale), [locale])
  const planned = useMemo(() => plannedTasks(board.tasks, today), [board.tasks, today])
  const { done, total } = useMemo(
    () => periodProgress(board.tasks, today, "today", firstDayOfWeek(locale)),
    [board.tasks, today, locale],
  )
  const loading = board.status === "loading"
  const live = board.status === "ready"
  const state = useMemo(() => ({ loading, unavailable: !loading && !live, live }), [loading, live])
  const status = { tasks: board.tasks, summary, planned, today, state }
  const pct = total ? Math.round((done / total) * 100) : 0
  const checked = summary.focusTotal ? Math.round((summary.focusDone / summary.focusTotal) * 3) : 0
  const counts = {
    overdue: summary.overdue.length,
    important: summary.important.length,
    planned: planned.length,
    done: summary.last7Total,
  }

  let lines = null
  if (live) lines = heroLines(t, plural, summary)
  else if (!loading)
    lines = {
      headline:
        board.status === "error"
          ? t("todo.error")
          : board.status === "denied"
            ? t("todo.denied")
            : t("todo.signedOut"),
      sub: "",
    }

  useTitleFit(titleRef, lines?.headline ?? "")

  // Sıradaki: en yakın ileri tarihli iş (masaüstü tepsinin Planlanan notuyla aynı kaynak).
  const next = planned[0]
  const nextText = next
    ? `${t("todo.status.next", { date: dueLabel(next.dueKey, today, t, locale) })} · ${next.title || t("todo.untitled")}`
    : t("todo.status.plannedNone")

  return (
    <section
      aria-label={t("todo.hero.aria")}
      data-ink={ink}
      data-shade={shade ?? undefined}
      style={{ "--hero-ink": HERO_INK[ink] }}
      className="group/herocard todo-pcard"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-from via-brand-via to-brand-to"
      />
      <button
        type="button"
        onClick={() => setSheet(true)}
        aria-haspopup="dialog"
        data-tour="todo-kpi"
        className={cn("todo-pcard-btn", HERO_SHADE)}
      >
        <span className="todo-pcard-id">
          <span className="todo-pcard-orb">
            <ChecklistOrb checked={checked} celebrate={celebrate} busy={busy} />
          </span>
          <span className="todo-pcard-text">
            {lines ? (
              <>
                <span ref={titleRef} className="todo-pcard-title" lang={locale}>
                  {lines.headline}
                </span>
                <span className="todo-pcard-sub">{lines.sub}</span>
              </>
            ) : (
              <span aria-hidden="true" className="todo-pcard-skel-text">
                <span className="todo-pcard-skel w-4/5" />
                <span className="todo-pcard-skel w-1/2" />
              </span>
            )}
          </span>
          <span className="todo-pcard-ring" aria-hidden="true">
            <MiniRing pct={live ? pct : 0} live={live} />
          </span>
        </span>

        <span className="todo-pcard-meta">
          {loading ? (
            <span aria-hidden="true" className="todo-pcard-meta-skel">
              <span className="todo-pcard-skel w-24" />
              <span className="todo-pcard-skel w-40" />
            </span>
          ) : (
            <>
              {live && (
                <span className="todo-pcard-chip" title={nextText}>
                  <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" strokeWidth={1.8} />
                  <span>{nextText}</span>
                </span>
              )}
            </>
          )}
        </span>

        {/* Sayılar ekran okuyucuya aşağıdaki özet cümlesinde: şeritteki kopya sessiz. */}
        <span className="todo-pcard-stats" aria-hidden="true">
          {CELLS.map(({ key, label }) => (
            <span key={key} className="todo-pcard-cell">
              {loading ? (
                <>
                  <span className="todo-pcard-skel w-8" />
                  <span className="todo-pcard-skel todo-pcard-skel-cap w-12" />
                </>
              ) : (
                <>
                  <span className="todo-pcard-value">{live ? counts[key] : "—"}</span>
                  <span className="todo-pcard-cap">{t(label)}</span>
                </>
              )}
            </span>
          ))}
        </span>

        {live && (
          <span className="sr-only">
            {t("todo.kpiBar.aria", {
              done,
              total,
              overdue: counts.overdue,
              important: counts.important,
              planned: counts.planned,
              doneWeek: counts.done,
            })}
          </span>
        )}
      </button>
      <BottomSheet open={sheet} onOpenChange={setSheet} title={t("todo.status.aria")}>
        <TodoStatusSheet
          {...status}
          onView={(v) => {
            setSheet(false)
            onView(v)
          }}
        />
      </BottomSheet>
    </section>
  )
}
