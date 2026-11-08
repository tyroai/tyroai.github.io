import { useMemo } from "react"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { countdownPhrase, countdownShort } from "@/features/widgets/horizon/horizonFormat"
import { releaseChip } from "@/features/widgets/reports/reportFormat"
import { useLocale } from "@/hooks/useLocale"
import { countdown } from "@/lib/horizon"
import { upcomingReports } from "@/lib/reportDay"
import { localDayKey } from "@/lib/todo"
import { upcomingTrips } from "@/lib/travel"
import { RollText } from "@/components/common/RollText"
import { useTrayCalendar, useWidgetPeek } from "./usePeeks"

const LABEL = "text-[0.8125rem] font-semibold tabular-nums leading-none"

/**
 * Bekleyen postalar: bayraklı posta sayısı ya da (`unread`) okunmamışlar; 0'da yok. Ad ya da konu
 * yüzde görünmez. Tepsi ve çentik ortak (çentikte sayı rozeti).
 */
function usePendingMailIndicator(show = "value") {
  const { t } = useLocale()
  const data = useWidgetPeek("pending-mail")
  const unread = show === "unread"
  const n = unread ? (data?.unreadTotal ?? 0) : (data?.flaggedTotal ?? data?.flagged?.length ?? 0)
  if (!n) return null
  return {
    count: n,
    text: String(n),
    sr: t(unread ? "headerWidgets.unreadSr" : "headerWidgets.mailSr", { n }),
  }
}

export function MailLabel({ show = "value" }) {
  return <ShortText ind={usePendingMailIndicator(show)} />
}

/** Seyahatim: sıradaki yolculuğa kalan gün ("3g", "Bugün"); yolculuk sürerken yok. */
function useTravelIndicator() {
  const { t, locale } = useLocale()
  const now = useMinuteNow()
  const cal = useTrayCalendar()
  const trip = upcomingTrips(cal.events, now)[0]
  if (!trip || trip.start.getTime() <= now) return null
  const cd = countdown(localDayKey(new Date(now)), localDayKey(trip.start))
  return {
    text: countdownShort(cd, t),
    sr: t("headerWidgets.travelSr", { when: countdownPhrase(cd, t, locale) }),
  }
}

export function TravelLabel() {
  return <ShortText ind={useTravelIndicator()} />
}

/**
 * Rapor günü: sıradaki piyasa raporuna kalan gün ("2g"), bugünse saati, yayımlandıysa ✓ — takvim
 * pakette, istek yok.
 */
function useReportIndicator() {
  const { t, locale } = useLocale()
  const now = useMinuteNow()
  const item = useMemo(() => upcomingReports(now)[0] ?? null, [now])
  if (!item) return null
  const chip = releaseChip(item, now, t, locale)
  const text =
    chip.tone === "done"
      ? "✓"
      : chip.tone === "soon"
        ? t("headerWidgets.daysShort", { n: 1 })
        : chip.text
  return {
    text,
    sr: t("widgets.reports.faceSr", {
      name: t(`widgets.reports.name.${item.report.id}`),
      when: chip.sr,
    }),
  }
}

export function ReportLabel() {
  return <ShortText ind={useReportIndicator()} />
}

/** Kısa görünen metin + ekran okuyucuya tam cümle (görünen kopya gizli). */
function ShortText({ ind }) {
  if (!ind) return null
  return (
    <span className={LABEL}>
      <span aria-hidden="true">
        <RollText text={ind.text} />
      </span>
      <span className="sr-only">{ind.sr}</span>
    </span>
  )
}

/** Çentik göstergesinin kaynağı (`notch/SlotIndicator`): değeri çocuğa verir; hook dışa açılmaz. */
export function PendingMailIndicator({ face, children }) {
  return children(usePendingMailIndicator(face?.show))
}

export function TravelIndicator({ children }) {
  return children(useTravelIndicator())
}

export function ReportIndicator({ children }) {
  return children(useReportIndicator())
}
