import { HugeiconsIcon } from "@hugeicons/react"
import { motion, useReducedMotion } from "motion/react"
import CheckmarkBadge01Icon from "@hugeicons/core-free-icons/CheckmarkBadge01Icon"
import CheckmarkBadge03Icon from "@hugeicons/core-free-icons/CheckmarkBadge03Icon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { BriefRows } from "./BriefRows"
import { useBrief } from "@/hooks/useBrief"
import { useBriefOof } from "./useBriefOof"
import { useBriefLines } from "./useBriefLines"
import { useBriefTips } from "./useBriefTips"
import { WidgetFrame } from "./WidgetFrame"
import "@/features/myspace/daySummary.css"

// En çok üç satır (otomatik yanıt satırı dahil): kart karşılamanın boyunda kalsın; gerisi tek
// satırlık "Ayrıca".
const MAX_ROWS = 3
const OPTS_DATE = { weekday: "long", day: "numeric", month: "long" }
// Dar kartta (içerik < 16rem) kısa tarih: uzun ad başlığı ve tarihi taşırıyordu (RU, EN).
const OPTS_DATE_SHORT = { weekday: "short", day: "numeric", month: "short" }

/**
 * TYRO brifingi — eylem paneli: öncelik sırasıyla maddeler (yanıt bekleyen
 * insanlar önce), her birinde sayı ve TEK eylem; davetler kartta yanıtlanır.
 * Başlık günün bölümüne göre (sabah · öğleden sonra · akşam kapanış), hafta
 * sonunda bir sonraki iş gününe hazırlık. Cümlelerdeki toplantı ifadeleri vurgulu
 * (`useBriefLines`; tonlar Anasayfa özetinin ölçülmüş `--ds-*`ları, `ds-tones`).
 * Saf hesap `lib/brief.js`te.
 */
export function BriefWidget({ ctx, className }) {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const brief = useBrief(ctx)
  const { tips, meetingsTip, dialog } = useBriefTips(brief.tipData)
  const { headline, shortHeadline, meetingLine, shortMeetingLine } = useBriefLines(
    brief,
    meetingsTip,
    { card: "brief" },
  )
  const { date, weekend, items, fresh } = brief
  const oof = useBriefOof(date.getTime())
  const max = oof ? MAX_ROWS - 1 : MAX_ROWS
  const shown = items.length > max ? items.slice(0, max - 1) : items
  const rest = items.length > max ? items.slice(max - 1) : []
  const loading = brief.loading
  return (
    <WidgetFrame
      id="brief"
      title={t("widgets.brief.title")}
      shortTitle={t("widgets.brief.titleShort")}
      icon={CheckmarkBadge03Icon}
      busy={loading}
      className={className}
      action={
        <>
          <span className="text-[0.75rem] text-muted-foreground [&::first-letter]:uppercase">
            <span className="@max-[16rem]/widget:hidden">
              {getDateTimeFormat(locale, OPTS_DATE).format(date)}
              {weekend && ` · ${t("widgets.brief.weekendTag")}`}
            </span>
            <span className="hidden @max-[16rem]/widget:inline">
              {getDateTimeFormat(locale, OPTS_DATE_SHORT).format(date)}
            </span>
          </span>
        </>
      }
    >
      {loading ? (
        <div aria-hidden="true" className="mt-2 space-y-1">
          <span className="ms-skeleton block h-5 w-3/4 rounded-full" />
          <span className="ms-skeleton block h-3.5 w-1/2 rounded-full" />
          <div className="space-y-1 pt-2.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="ms-skeleton block h-8 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="ds-tones">
            <p className="mt-1.5 truncate text-[1rem] font-semibold leading-snug tracking-[-0.01em]">
              {shortHeadline === headline ? (
                headline
              ) : (
                <>
                  <span className="@max-[16rem]/widget:hidden">{headline}</span>
                  <span className="hidden @max-[16rem]/widget:inline">{shortHeadline}</span>
                </>
              )}
            </p>
            {meetingLine && (
              <p className="mt-0.5 truncate text-[0.75rem] leading-5 text-muted-foreground">
                {shortMeetingLine === meetingLine ? (
                  meetingLine
                ) : (
                  <>
                    <span className="@max-[16rem]/widget:hidden">{meetingLine}</span>
                    <span className="hidden @max-[16rem]/widget:inline">{shortMeetingLine}</span>
                  </>
                )}
              </p>
            )}
          </div>
          {items.length || oof ? (
            <BriefRows
              shown={shown}
              rest={rest}
              fresh={fresh}
              tips={tips}
              todoOpen={brief.tipData.todoOpen}
              oof={oof}
            />
          ) : null}
          {!items.length && (
            <div className="brief-clear mt-3 flex flex-1 items-center gap-3 rounded-2xl bg-emerald-500/[0.07] px-3 py-3">
              {/* Her şey tamamlanınca rozet bir kez yaylanarak gelir (iOS'un "tamam" işareti gibi). */}
              <motion.span
                initial={reduce ? false : { scale: 0.4, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="shrink-0"
              >
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  className="size-6 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={1.8}
                />
              </motion.span>
              <span className="text-[0.8125rem] text-foreground/80">
                {t("widgets.brief.clearBody")}
              </span>
            </div>
          )}
        </>
      )}
      {dialog}
    </WidgetFrame>
  )
}
