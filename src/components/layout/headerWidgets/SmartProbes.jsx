import { useEffect } from "react"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { useHorizon } from "@/features/widgets/horizon/useHorizon"
import { useFocusTimer } from "@/lib/focusTimer"
import { localDayKey } from "@/lib/todo"
import { useTrayCalendar } from "./faces/usePeeks"
import { horizonScore, meetingScore, timerScore } from "./smartTop"

/**
 * Akıllı tepsi düğmesinin yoklayıcıları: yalnız tepside olan widget için kurulur ve puanını
 * yukarı bildirir (`onScore(id, puan)`); kendisi bir şey çizmez. Veri tepsinin zaten kullandığı
 * kaynaklardan (takvimin ortak anahtarı, odak sayacı, Ufukta) — yeni istek yok.
 */
export function SmartProbes({ items, onScore }) {
  return (
    <>
      {items.includes("next-meeting") && <MeetingProbe onScore={onScore} />}
      {items.includes("focus-timer") && <TimerProbe onScore={onScore} />}
      {items.includes("horizon") && <HorizonProbe onScore={onScore} />}
    </>
  )
}

function MeetingProbe({ onScore }) {
  const now = useMinuteNow()
  const cal = useTrayCalendar()
  const score = meetingScore(cal.events, now)
  useEffect(() => onScore("next-meeting", score), [onScore, score])
  return null
}

function TimerProbe({ onScore }) {
  const now = useMinuteNow()
  const timer = useFocusTimer()
  const score = timerScore(timer, now)
  useEffect(() => onScore("focus-timer", score), [onScore, score])
  return null
}

function HorizonProbe({ onScore }) {
  const now = useMinuteNow()
  const { status, items } = useHorizon()
  const score = status === "ready" ? horizonScore(items, localDayKey(new Date(now))) : 0
  useEffect(() => onScore("horizon", score), [onScore, score])
  return null
}
