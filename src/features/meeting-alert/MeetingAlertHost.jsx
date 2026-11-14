import { useEffect } from "react"
import { formatCountdown } from "@/features/meeting-alert/lib/meetingAlert"
import { useWelcomeOpen } from "@/lib/welcomeGate"
import { MeetingCountdown } from "./MeetingCountdown"
import { MeetingCountdownPill } from "./MeetingCountdownPill"
import { useMeetingAlert } from "./useMeetingAlert"

// Sekme başlığının öneki: kişi başka sekmedeyken de geri sayımı görür.
const PREFIX = /^⏱ [^·]+· /

/**
 * Sıradaki toplantının geri sayımı — uygulamada tek ev (App). 15 dk kala
 * ortada pencere, küçültülünce sağ altta hap; sekme başlığında da sayar.
 */
export function MeetingAlertHost() {
  const alert = useMeetingAlert()
  const label = alert.event
    ? alert.phase === "started"
      ? "▶"
      : formatCountdown(alert.msLeft)
    : null

  useEffect(() => {
    if (!label) return undefined
    const base = document.title.replace(PREFIX, "")
    document.title = `⏱ ${label} · ${base}`
    return () => {
      document.title = document.title.replace(PREFIX, "")
    }
  }, [label])

  // Telefondaki karşılama çekmecesi açıkken pencere de hap da bekler: modal pencere çekmeceyi
  // dokunmaya kapatıyordu (`lib/welcomeGate`). Çekmece kapanınca kendiliğinden gelir.
  const welcomeOpen = useWelcomeOpen()
  if (!alert.event || welcomeOpen) return null
  return alert.cardOpen ? (
    <MeetingCountdown alert={alert} />
  ) : (
    <MeetingCountdownPill alert={alert} />
  )
}
