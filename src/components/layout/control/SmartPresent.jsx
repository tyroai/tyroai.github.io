import { useEffect, useMemo, useRef } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { notify } from "@/lib/notify"
import { setPresentMode, usePresentMode } from "@/lib/presentMode"
import { setPrivateTitlesHidden } from "@/lib/privateTitles"
import { interruptsMuted } from "@/lib/quietMode"
import { useTrayCalendar } from "../headerWidgets/faces/usePeeks"
import { joinableMeeting, meetingKey } from "./joinModel"

// Bu sayfa açıkken teklif edilen toplantılar (Denetim Merkezi yeniden kurulsa da bir kez).
const offered = new Set()

/**
 * Akıllı Sunum modu: çevrim içi toplantı başlayınca bir kez "Sunum modu açılsın mı?" der (mod
 * zaten açıksa ya da Odak modundaysa demez). Modu bu teklif açtırdıysa toplantı bitince
 * kendiliğinden kapatır ve söyler; kişi arada kendisi kapattıysa karışmaz. Sunum modu açıkken
 * kişisel öğelerin ipucu (`title`) da gizlenir (`lib/privateTitles`). Çizmez.
 */
export function SmartPresent() {
  const { t } = useLocale()
  const cal = useTrayCalendar()
  const now = useMinuteNow().getTime()
  const present = usePresentMode()
  const live = useMemo(() => joinableMeeting(cal.events, now, 0), [cal.events, now])
  const auto = useRef(null)

  useEffect(() => {
    setPrivateTitlesHidden(present)
  }, [present])
  useEffect(() => () => setPrivateTitlesHidden(false), [])

  useEffect(() => {
    if (!live || present || interruptsMuted()) return
    const key = meetingKey(live)
    if (offered.has(key)) return
    offered.add(key)
    notify.info(t("control.present.offer"), {
      duration: 15000,
      action: {
        label: t("control.present.turnOn"),
        onClick: () => {
          auto.current = key
          setPresentMode(true)
        },
      },
    })
  }, [live, present, t])

  useEffect(() => {
    if (!present) {
      auto.current = null
      return
    }
    const key = auto.current
    if (!key || (live && meetingKey(live) === key)) return
    auto.current = null
    setPresentMode(false)
    notify.info(t("control.present.autoOff"))
  }, [live, present, t])

  return null
}
