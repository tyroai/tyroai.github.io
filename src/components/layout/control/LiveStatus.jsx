import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Timer02Icon from "@hugeicons/core-free-icons/Timer02Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { formatClock, remainingMs, useFocusTimer } from "@/lib/focusTimer"
import { useRest } from "@/lib/restMode"
import { useTrayCalendar } from "../headerWidgets/faces/usePeeks"
import { useHeaderWidgets } from "../headerWidgets/headerStore"
import { currentMeeting, minutesUntil, soonMeeting } from "./joinModel"

/** Sayaç çalışırken saniyede bir "şimdi"; dururken ya da dinlenme kipinde çizdirmez. */
function useSecond(on) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!on) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [on])
  return now
}

/**
 * Denetim Merkezi düğmesinin canlı kapsülü (Dynamic Island gibi, yalnız gerektiğinde): odak sayacı
 * çalışıyorsa kalan süre (sayaç header'da widget olarak duruyorsa tekrarlamaz), yoksa 10 dakika
 * içinde başlayacak toplantı varsa kalan dakika. Toplantı sürerken simgenin solunda marka renginde
 * işaret (çevrim içiyse kamera, değilse kişiler; Sunum modunun kapalı gözü gibi). Takvim header'ın
 * yüzleriyle ortak (yeni istek yok). Görünen yazı düğmenin adının parçası; öncesindeki bağlam
 * ekran okuyucuya.
 */
export function LiveStatus() {
  const { t } = useLocale()
  const timer = useFocusTimer()
  const { items } = useHeaderWidgets()
  const rest = useRest()
  const timing = timer.endsAt != null && !items.includes("focus-timer")
  const now = useSecond(timing && !rest)
  const cal = useTrayCalendar()
  const minute = useMinuteNow().getTime()
  const meeting = useMemo(() => soonMeeting(cal.events, minute), [cal.events, minute])
  const ongoing = useMemo(() => currentMeeting(cal.events, minute), [cal.events, minute])
  const mark = ongoing && (
    <>
      <span className="sr-only">{`, ${t("control.live.inMeeting")}`}</span>
      <HugeiconsIcon
        icon={ongoing.isOnlineMeeting || ongoing.joinUrl ? Video01Icon : UserGroupIcon}
        strokeWidth={1.8}
        aria-hidden="true"
        className="size-4 text-brand"
        data-live="meeting-now"
      />
    </>
  )
  if (timing) {
    return (
      <>
        <span className="cc-live" data-kind="timer">
          <HugeiconsIcon icon={Timer02Icon} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">{`, ${t("control.live.timer")} `}</span>
          {formatClock(remainingMs(timer, now))}
        </span>
        {mark}
      </>
    )
  }
  return (
    <>
      {meeting && (
        <span className="cc-live" data-kind="meeting">
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">{`, ${t("control.live.meeting")} `}</span>
          {t("control.live.min", { n: minutesUntil(meeting.start, minute) })}
        </span>
      )}
      {mark}
    </>
  )
}
