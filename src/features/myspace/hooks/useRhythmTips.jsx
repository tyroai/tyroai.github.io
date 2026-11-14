import { useMemo, useState } from "react"
import { PreviewDialog } from "@/features/myspace/preview/PreviewDialog"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { openMeetingSummary } from "@/lib/summaryBus"
import { OPTS_TIME } from "../cardFormats"
import { RhythmMeetingList } from "../RhythmMeetingList"
import { formatHM } from "../rhythmFormat"

const PLURAL = new Set(["zero", "one", "two", "few", "many", "other"])
const OPTS_DAY_LONG = { weekday: "long", day: "numeric", month: "long" }

/**
 * Toplantı ritminin gün balonu — büyük kart (`MeetingRhythmCard`) ve küçük kart (`RhythmMini`) aynı
 * balonu açar (`InsightTip`): tarih · kaç toplantı ve ne kadar · toplantıların listesi (basınca
 * önizleme; geçmiş Teams toplantısında Sohbet · Özet) · çakışma varsa not. Süre çubuğun sayısı
 * (birleşim), listedeki tek tek süreler değil. Önizleme ve özet açılırken balon önce kapanır, pencere
 * bir kare sonra açılır (sıra tersine dönerse odak balonun tetiğinde kalırdı).
 *
 * Dönüş: `tipFor(gün, bugünMü)`, `countText(n)` ("10 toplantı") ve sayfaya bir kez konacak `dialog`.
 */
export function useRhythmTips(now) {
  const { t, locale } = useLocale()
  const plural = useMemo(() => new Intl.PluralRules(locale), [locale])
  const [preview, setPreview] = useState(null)
  const dayLong = getDateTimeFormat(locale, OPTS_DAY_LONG)
  const timeFmt = getDateTimeFormat(locale, OPTS_TIME)

  const countText = (n) => {
    const cat = plural.select(n)
    return t(`myspace.rhythm.count.${PLURAL.has(cat) ? cat : "other"}`, { n })
  }
  const later = (close, open) => {
    close()
    requestAnimationFrame(open)
  }

  function tipFor(d, isToday) {
    const date = dayLong.format(d.date)
    const title = isToday ? `${t("myspace.meeting.today")} · ${date}` : date
    if (!d.items.length) return { title, kicker: t("myspace.rhythm.none") }
    return {
      title,
      kicker: `${countText(d.items.length)} · ${formatHM(d.minutes, t)}`,
      list: (close) => (
        <RhythmMeetingList
          items={d.items}
          timeFmt={timeFmt}
          now={now}
          onOpen={(event) => later(close, () => setPreview({ kind: "event", item: event }))}
          onSummary={(event) => later(close, () => openMeetingSummary(event))}
        />
      ),
      note: d.overlap ? t("myspace.rhythm.overlap") : null,
    }
  }

  const dialog = <PreviewDialog preview={preview} onClose={() => setPreview(null)} />
  return { tipFor, countText, dialog }
}
