import { useMemo } from "react"
import { useFlaggedLeftovers } from "@/hooks/useFlaggedLeftovers"
import { useLocale } from "@/hooks/useLocale"
import { useMyProfileDetails } from "@/hooks/useMyProfileDetails"
import { useSelfService } from "@/hooks/useSelfService"
import { useSelfServiceTeam } from "@/hooks/useSelfServiceTeam"
import { useTodoBoard } from "@/hooks/useTodoBoard"
import { withNames } from "@/lib/selfServiceNames"
import { hireDayOf } from "@/lib/selfServiceProfile"
import { worstBoard } from "@/dev/worstCase/calendarEvents"

/**
 * Kapıya bağlı iki kaynak: görevler (To-Do) ve izinler (Self Servis). İkisinin kancası `enabled`
 * almıyor ve açılışta okuyor; kapalı kapıda istek yapılmasın diye kanca yalnız kapı açıksa
 * çalışan bir bileşende. Kapalıyken çocuklara `null` verilir ("bu katman yok").
 */

/** Görevler: To-Do sayfasıyla aynı süzülmüş pano (bayrağı kalkmış e-posta görevleri düşer). */
function TasksLoad({ children }) {
  const board = useFlaggedLeftovers(useTodoBoard())
  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstBoard() : null
  return children(worst ? { ...board, ...worst } : board)
}

export function TasksSource({ enabled, children }) {
  return enabled ? <TasksLoad>{children}</TasksLoad> : children(null)
}

/**
 * İzinler: kendi kayıtlarım ve bakiyem (`useSelfService`, adlar eklenmiş) ile ekibin izinleri
 * (`useSelfServiceTeam`: Graph'tan ekip, ERP'den türsüz izin günleri). Dönen `{ status, data,
 * team, hireDate, refresh, poll, connect }`; `poll` sessiz yoklama (yeni talep gözcüsü).
 */
function LeaveLoad({ children }) {
  const { t } = useLocale()
  const own = useSelfService()
  const team = useSelfServiceTeam(true)
  const { details } = useMyProfileDetails()
  const { status, data: raw, refresh, poll, connect } = own
  const data = useMemo(() => withNames(raw, t), [raw, t])
  const hireDate = useMemo(() => hireDayOf(details?.employeeHireDate), [details])
  const value = useMemo(
    () => ({ status, data, team, hireDate, refresh, poll, connect }),
    [status, data, team, hireDate, refresh, poll, connect],
  )
  return children(value)
}

export function LeaveSource({ enabled, children }) {
  return enabled ? <LeaveLoad>{children}</LeaveLoad> : children(null)
}
