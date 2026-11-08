import { lazy, Suspense } from "react"
import { useFocusTimer } from "@/lib/focusTimer"

const FocusTimerAlarm = lazy(() => import("./FocusTimerAlarm"))

/**
 * Sayaç çalışırken ve bittikten sonra bitiş uyarısını bağlar (header'da, her sayfada); hiç
 * kullanılmadıysa hiçbir şey indirmez.
 */
export function FocusTimerGate() {
  const timer = useFocusTimer()
  return timer.endsAt || timer.doneAt ? (
    <Suspense fallback={null}>
      <FocusTimerAlarm />
    </Suspense>
  ) : null
}
