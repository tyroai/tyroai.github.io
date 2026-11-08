import { useCallback, useEffect, useRef, useState } from "react"

// Dönüş en az bu kadar sürer: kaynaklar önbellekten anında dönse de basışın karşılığı görünsün.
const MIN_SPIN_MS = 800

/**
 * Takvimin "Yenile"si: Outlook (paylaşılan takvimler dahil), To-Do, kendi izinlerim ve ekibin
 * izinleri birlikte yeniden okunur; her kaynak kendi `refresh`iyle (kapalı kaynak null). `busy`:
 * düğmenin simgesi döner — en az `MIN_SPIN_MS`, bir kaynak hâlâ yükleniyorsa o bitene dek.
 */
export function useCalendarRefresh({ data, tasks, leave }) {
  const [spin, setSpin] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const refreshEvents = data.refresh
  const refresh = useCallback(() => {
    refreshEvents?.()
    tasks?.refresh?.()
    leave?.refresh?.()
    leave?.team?.refresh?.()
    setSpin(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSpin(false), MIN_SPIN_MS)
  }, [refreshEvents, tasks, leave])
  const busy =
    spin || Boolean(data.loading) || Boolean(tasks?.refreshing) || leave?.status === "loading"
  return { refresh, busy }
}
