import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { breakdownLines } from "@/lib/leaveDays"
import { cn } from "@/lib/utils"
import { countText, number, range } from "../../kinds"
import { ImpactRows } from "./ImpactRows"
import { dayLine, longDay, reasonText } from "./leaveText"

// Alçak pencerede (≤ 780 px) bölümler sıkı: form ilk açılışta kaydırmadan sığsın.
const ROW = "border-t border-black/[0.06] px-5 py-4 shorter:py-3 dark:border-white/[0.08]"
// Dokunmatikte vuruş alanı görünmez bir kenarla büyür (metnin akışı bozulmaz).
const TXT_BTN =
  "relative inline-flex min-h-6 items-center gap-1 rounded text-[0.8125rem] font-semibold text-brand-ink transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-2.5"

/** Çakışan iznin metni: aralık (türüyle). */
function overlapText(rec, locale) {
  const when = range(rec.start, rec.end ?? rec.start, locale)
  return rec.typeName ? `${when} (${rec.typeName})` : when
}

/**
 * Bir ipucu satırı: ikon + metin (+ en çok bir eylem). `tone`: bilgi (soluk yazı) · dikkat (sarı
 * zemin) · hata (kırmızı zemin) — durum renkleri her formda aynı.
 */
function Hint({ tone = "info", children, action }) {
  const icon = tone === "info" ? InformationCircleIcon : Alert02Icon
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-[0.8125rem] leading-snug",
        tone === "info" && "text-muted-foreground",
        tone === "warn" && "-mx-1 rounded-xl bg-warning/[0.12] px-3 py-2 text-warning-ink",
        tone === "error" &&
          "-mx-1 rounded-xl bg-danger/[0.08] px-3 py-2 font-medium text-danger-ink",
      )}
    >
      <HugeiconsIcon icon={icon} aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">
        {children}
        {action && <span className="mt-1 block">{action}</span>}
      </span>
    </p>
  )
}

/**
 * İzin talebinin etki kartı (masaüstünde sağda yapışık, telefonda formun altında). Tarih yokken
 * yıllık izinde köprü fırsatları ve bekleyen talebin; aralık seçilince iş günü (gün gün nasıl
 * hesaplandığıyla), bakiye (bekleyenlerle), köprü önerisi, çakışma ve tatile denk gelen uç, sonra
 * ekip · toplantı · yönetici. Hepsi deterministik; bilinmeyen satır çizilmez.
 */
export function ImpactCard({ impact, values, onRange, onUndo, undo }) {
  const { t, locale } = useLocale()
  const [how, setHow] = useState(false)
  const { annual, range: r, balance: b } = impact
  const days = (n) => countText(t, locale, "selfService.days", n)

  if (!r) {
    return (
      <section
        aria-label={t("selfService.leave.impact")}
        className="overflow-hidden rounded-2xl border border-black/[0.08] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.12)] dark:border-white/[0.1]"
      >
        {/* Nasıl seçileceği (tek gün için aynı güne iki kez) ⓘ'de: kart başlıkla yetinsin. */}
        <p className="flex items-center gap-1 px-5 py-4 text-[0.9375rem] font-semibold shorter:py-3">
          {t("selfService.leave.pickDates")}
          <InfoTip text={t("selfService.leave.pickHint")} />
        </p>
        {annual && impact.bridges.length > 0 && (
          <div className={ROW}>
            <p className="mb-2 text-[0.9375rem] font-semibold">{t("selfService.leave.bridges")}</p>
            <ul className="space-y-3">
              {impact.bridges.map((x) => (
                <li key={x.day.getTime()} className="text-[0.8125rem]">
                  <p className="font-semibold">{longDay(x.day, locale)}</p>
                  <p className="text-muted-foreground">
                    {t(
                      x.cost < 1 ? "selfService.leave.bridgeHalf" : "selfService.leave.bridgeOne",
                      { n: number(x.block.days, locale) },
                    )}
                    {" · "}
                    {range(x.block.start, x.block.end, locale)}
                  </p>
                  <button type="button" className={TXT_BTN} onClick={() => onRange(x.day, x.day)}>
                    {t("selfService.leave.useDates")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {impact.waiting.length > 0 && (
          <div className={ROW}>
            <p className="mb-1 text-[0.9375rem] font-semibold">{t("selfService.leave.waiting")}</p>
            {impact.waiting.slice(0, 2).map((w) => (
              <p
                key={`${w.start.getTime()}-${w.typeCode}`}
                className="text-[0.8125rem] text-muted-foreground"
              >
                {range(w.start, w.end ?? w.start, locale)} · {w.typeName ?? ""} ·{" "}
                {t("selfService.leave.pendingStatus")}
              </p>
            ))}
          </div>
        )}
        <ImpactRows impact={impact} />
      </section>
    )
  }

  const lines = breakdownLines(r.breakdown)
  const nonAnnual = !annual
  // İpucu bölümü yalnız çizilecek bir satır varsa: köprü sonucu boş da gelebilir (öneri yok).
  const nudge = annual && r.bridge?.bridge && !r.overlap.length
  const block =
    annual && !r.bridge?.bridge && r.bridge?.block && r.bridge.block.days > r.calendarDays
  const hints = r.overlap.length > 0 || r.edge || nudge || block || undo
  return (
    <section
      aria-label={t("selfService.leave.impact")}
      className="overflow-hidden rounded-2xl border border-black/[0.08] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.12)] dark:border-white/[0.1]"
    >
      <div className="px-5 pb-4 pt-5" aria-live="polite">
        <p className="flex items-baseline gap-2">
          <span className="text-[2.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            {number(r.days, locale)}
          </span>
          <span className="text-[0.9375rem] font-semibold text-muted-foreground">
            {t("selfService.form.workdays")}
          </span>
          {/* Yıllık izin dışında hangi sayının esas olduğunu ERP belirler: bilgi ⓘ'de. */}
          {nonAnnual && <InfoTip text={t("selfService.leave.nonAnnual")} className="self-center" />}
        </p>
        <p className="mt-2 text-[0.8125rem] text-muted-foreground tabular-nums">
          {range(values.start, values.end, locale)} ·{" "}
          {countText(t, locale, "selfService.leave.calendarDays", r.calendarDays)}
        </p>
        <button
          type="button"
          aria-expanded={how}
          onClick={() => setHow((v) => !v)}
          className={cn(TXT_BTN, "mt-2")}
        >
          {t("selfService.leave.how")}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden="true"
            className={cn("size-3.5 transition-transform", how && "rotate-180")}
            strokeWidth={2}
          />
        </button>
        <AnimatePresence initial={false}>
          {how && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-2 space-y-1 overflow-hidden text-[0.8125rem] tabular-nums"
            >
              {lines.map((l) => (
                <li key={l.from.getTime()} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {dayLine(t, locale, l)}
                  </span>
                  <span className="font-medium">{number(l.weight, locale)}</span>
                </li>
              ))}
              <li className="pt-1 text-[0.75rem] text-muted-foreground">
                {t(r.covered ? "selfService.form.daysNote" : "selfService.leave.notCovered")}
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {b && (
        <div className={ROW}>
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[0.8125rem]">
            <span className="font-medium">{t("selfService.leave.balance")}</span>
            <span className="whitespace-nowrap font-semibold tabular-nums">
              {days(b.from)} → {days(b.after)}
            </span>
          </p>
          <span
            aria-hidden="true"
            className="relative mt-2 flex h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]"
          >
            <span
              className={cn("h-full", b.over ? "bg-warning" : "bg-brand-fill-deep")}
              style={{ width: `${b.share.left * 100}%` }}
            />
            <span
              className="h-full bg-[repeating-linear-gradient(45deg,rgb(0_0_0/0.22)_0_2px,transparent_2px_5px)] dark:bg-[repeating-linear-gradient(45deg,rgb(255_255_255/0.3)_0_2px,transparent_2px_5px)]"
              style={{ width: `${b.share.pending * 100}%` }}
            />
            <span
              className={cn("h-full", b.over ? "bg-warning/40" : "bg-brand/30")}
              style={{ width: `${b.share.request * 100}%` }}
            />
          </span>
          {b.pending > 0 && b.afterAll >= 0 && (
            <p className="mt-2 text-[0.75rem] text-muted-foreground">
              {t("selfService.leave.withPending", {
                pending: days(b.pending),
                left: days(b.afterAll),
              })}
            </p>
          )}
          {b.over > 0 && (
            <div className="mt-2">
              <Hint tone="warn">{t("selfService.leave.over", { days: days(b.over) })}</Hint>
            </div>
          )}
          {b.overWithPending > 0 && (
            <div className="mt-2">
              <Hint tone="warn">
                {t("selfService.leave.overWithPending", { days: days(b.overWithPending) })}
              </Hint>
            </div>
          )}
        </div>
      )}

      {hints && (
        <div className={cn(ROW, "space-y-3")}>
          {r.overlap.length > 0 && (
            <Hint tone="error">
              {t("selfService.leave.overlap", { when: overlapText(r.overlap[0], locale) })}
            </Hint>
          )}
          {r.edge?.edge === "none" && <Hint>{t("selfService.leave.edgeNone")}</Hint>}
          {r.edge && r.edge.edge !== "none" && (
            <Hint
              action={
                <button
                  type="button"
                  className={TXT_BTN}
                  onClick={() =>
                    r.edge.edge === "start"
                      ? onRange(r.edge.day, values.end)
                      : onRange(values.start, r.edge.day)
                  }
                >
                  {t(
                    r.edge.edge === "start"
                      ? "selfService.leave.edgeStartFix"
                      : "selfService.leave.edgeEndFix",
                  )}
                </button>
              }
            >
              {t(
                r.edge.edge === "start"
                  ? "selfService.leave.edgeStart"
                  : "selfService.leave.edgeEnd",
                {
                  reason: reasonText(t, r.edge.reason, r.edge.holiday),
                  day: longDay(r.edge.day, locale),
                },
              )}
            </Hint>
          )}
          {nudge && (
            <Hint
              action={
                <button
                  type="button"
                  className={TXT_BTN}
                  onClick={() =>
                    r.bridge.bridge.side === "end"
                      ? onRange(values.start, r.bridge.bridge.day, true)
                      : onRange(r.bridge.bridge.day, values.end, true)
                  }
                >
                  {t("selfService.leave.addBridge")}
                </button>
              }
            >
              {t("selfService.leave.nudge", {
                day: longDay(r.bridge.bridge.day, locale),
                when: range(r.bridge.bridge.block.start, r.bridge.bridge.block.end, locale),
                n: number(r.bridge.bridge.block.days, locale),
              })}
            </Hint>
          )}
          {block && (
            <Hint>
              {t("selfService.leave.block", {
                when: range(r.bridge.block.start, r.bridge.block.end, locale),
                n: number(r.bridge.block.days, locale),
              })}
            </Hint>
          )}
          {undo && (
            <p
              className="flex items-center gap-3 text-[0.8125rem] text-muted-foreground"
              aria-live="polite"
            >
              {t("selfService.leave.bridgeAdded")}
              <button type="button" className={TXT_BTN} onClick={onUndo}>
                {t("selfService.leave.undo")}
              </button>
            </p>
          )}
        </div>
      )}

      <ImpactRows impact={impact} />
    </section>
  )
}
