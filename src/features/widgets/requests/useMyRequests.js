import { useMemo } from "react"
import { useDismissedAlerts } from "@/features/selfservice/alerts/useDismissedAlerts"
import { useDraftKinds } from "@/features/selfservice/request/useDraftKinds"
import { useLocale } from "@/hooks/useLocale"
import { useSelfService } from "@/hooks/useSelfService"
import { requestItems } from "@/features/widgets/lib/myRequests"
import { loadDraft } from "@/lib/requestDrafts"
import { withNames } from "@/lib/selfServiceNames"

/**
 * Taleplerim'in verisi: Self Servis'in TAM okuması (`useSelfService`, önbelleği sayfayla ortak:
 * kart açıkken Self Servis'e geçmek beklemez), oturumda kapatılan uyarılar ve yarım kalan form
 * taslakları. `now`: panonun saati — gün dönünce satırlar (yıl sonu) yeniden hesaplanır.
 */
export function useMyRequests(now) {
  const { t } = useLocale()
  const ss = useSelfService()
  const [dismissed] = useDismissedAlerts()
  const kinds = useDraftKinds()
  const date = new Date(now)
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const raw = ss.status === "ready" ? ss.data : null
  const data = useMemo(() => (raw ? withNames(raw, t) : null), [raw, t])
  const items = useMemo(() => {
    const drafts = kinds
      .split(",")
      .filter(Boolean)
      .map((kind) => ({ kind, at: loadDraft(kind)?.at ?? null }))
    return requestItems(data, { now: new Date(day), dismissed, drafts })
  }, [data, dismissed, kinds, day])
  return { status: ss.status, items }
}
