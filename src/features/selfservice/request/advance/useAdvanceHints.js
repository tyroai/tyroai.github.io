import { useMemo } from "react"
import { useCalendarEvents } from "@/hooks/useCalendarEvents"
import { useMyManager } from "@/hooks/useMyManager"
import { lastAdvance, openAdvances, tripFromEvents } from "@/features/selfservice/lib/advanceHints"
import { addDays, startOfDay, ymd } from "@/lib/leaveDays"

// Takvimden yolculuk önerisi için bakılan pencere (gün).
const AHEAD = 31

/**
 * Avans formunun önerileri: kapatılmamış avanslar, son avans (tekrar ve şirket önerisi), takvimden
 * yolculuk ve yönetici. Veri sayfanın (`advances`) ve var olan kancaların; yoksa boş döner.
 * `enabled` false (izin ya da masraf formu): takvim ve yönetici sorulmaz, liste boş.
 */
export function useAdvanceHints({ advances, today, enabled = true }) {
  const day = ymd(today)
  const open = useMemo(() => openAdvances(enabled ? advances : null), [enabled, advances])
  const last = useMemo(() => lastAdvance(enabled ? advances : null), [enabled, advances])
  // Pencere günde bir kez kurulur: her çizimde yeni tarih nesnesi takvimi yeniden istetmesin.
  const span = useMemo(() => {
    const from = startOfDay(today)
    return { from, to: addDays(from, AHEAD) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])
  const cal = useCalendarEvents(span.from, span.to, enabled)
  const trip = useMemo(
    () => (enabled && cal.status === "ready" ? tripFromEvents(cal.events, span.from) : null),
    [enabled, cal.status, cal.events, span],
  )
  const manager = useMyManager(enabled)
  return { open, last, trip, manager }
}
