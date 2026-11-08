import { useEffect } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { useFocusMode } from "@/lib/focusMode"
import { applyLink } from "./focusLinkActions"
import { focusLinks, setApplied } from "./focusLinkStore"
import { clearPresence, moveBlockEnd, setPresence } from "./graphTools"

const MIN = 60_000

/**
 * Odak modunu izler (Denetim Merkezi'nin parçasıyla gelir, çizmez): açılınca açık bağları uygular,
 * süre değişince bloğu ve Teams'i yeni bitişe taşır, erken kapanınca bloğun bitişini o ana çeker ve
 * Teams'i bırakır; süre dolunca yapacak bir şey yok (blok o an biter, Teams süresi dolar). İzin
 * istemez: izin anahtar açılırken istenmişti; yoksa bağ sessizce atlanır.
 */
export function FocusLinks() {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const { t } = useLocale()
  const { until } = useFocusMode()

  useEffect(() => {
    const links = focusLinks()
    const applied = links.applied
    const subject = t("control.focus.blockSubject")
    if (until != null) {
      if (applied?.until === until) return
      if (applied) {
        // Odak yeni süreyle yeniden başladı: blok ve Teams yeni bitişe.
        if (applied.eventId) moveBlockEnd(instance, account, applied.eventId, new Date(until))
        if (applied.presence)
          setPresence(instance, account, "DoNotDisturb", (until - Date.now()) / MIN)
        setApplied({ ...applied, until })
        return
      }
      setApplied({ until, eventId: null, presence: false })
      if (links.calendar) applyLink(instance, account, "calendar", true, until, subject)
      if (links.teams) applyLink(instance, account, "teams", true, until, subject)
      return
    }
    if (!applied) return
    setApplied(null)
    if (Date.now() >= applied.until - MIN) return
    if (applied.eventId) moveBlockEnd(instance, account, applied.eventId, new Date())
    if (applied.presence) clearPresence(instance, account)
  }, [until, instance, account, t])

  return null
}
