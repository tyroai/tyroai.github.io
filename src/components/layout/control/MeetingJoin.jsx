import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { useJoinUrl } from "@/hooks/useJoinUrl"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { joinInTeams } from "@/lib/teamsJoin"
import { useTrayCalendar } from "../headerWidgets/faces/usePeeks"
import { useControlActions } from "./controlActions"
import { joinableMeeting, minutesUntil } from "./joinModel"

/**
 * Toplantıya katıl (ızgaranın üstünde, yalnız gerektiğinde): çevrim içi toplantı 15 dakika
 * içinde başlıyorsa ya da sürüyorsa konusu (kişisel: Sunum modunda bulanık), kalan süre ve
 * "Katıl" — Teams'te açar (`joinInTeams`), pencere kapanır. Takvim verisi header'ın yüzleriyle
 * ortak (yeni istek yok); katılma linki listede yoksa davetten okunur (`useJoinUrl`).
 */
export function MeetingJoin() {
  const { t } = useLocale()
  const cal = useTrayCalendar()
  const now = useMinuteNow().getTime()
  const meeting = useMemo(() => joinableMeeting(cal.events, now), [cal.events, now])
  const { url } = useJoinUrl(meeting, Boolean(meeting))
  const { close } = useControlActions()
  if (!meeting || !url) return null
  const mins = minutesUntil(meeting.start, now)
  const subject = meeting.subject || t("calendar.noSubject")
  return (
    <div className="cc-join">
      <span className="cc-ic" aria-hidden="true">
        <HugeiconsIcon icon={Video01Icon} strokeWidth={1.8} />
      </span>
      <span className="cc-text">
        <span className="cc-label" data-private="">
          {subject}
        </span>
        <span className="cc-sub">
          {mins > 0 ? t("control.join.in", { n: mins }) : t("control.join.now")}
        </span>
      </span>
      <button
        type="button"
        className="cc-pill"
        data-tone="prominent"
        aria-label={t("control.join.aria", { subject })}
        onClick={(e) => {
          // `joinInTeams` tıklamanın kendisini ister (değiştirici tuş, sol tık). Teams uygulaması
          // açılamıyorsa (Teams bağlantısı değil, Firefox) bağlantı tarayıcıda yeni sekmede açılır.
          if (!joinInTeams(e, url, t)) window.open(url, "_blank", "noopener,noreferrer")
          close()
        }}
      >
        {t("control.join.cta")}
      </button>
    </div>
  )
}
