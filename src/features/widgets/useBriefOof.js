import { loadLeaveSummary, peekLeaveSummary } from "@/features/widgets/hooks/useLeaveSummary"
import { peekSelfService } from "@/hooks/useSelfService"
import { useWidgetData } from "@/hooks/useWidgetData"
import { STATUS } from "@/lib/graph"
import { OOF_TTL, fetchOwnOof, onLeaveToday, oofReminder } from "@/features/widgets/lib/oofHealth"

/** ERP izin kaydı: bellekte varsa o (Self Servis ya da İzin bakiyem okumuş), yoksa hafif okuma. */
async function leaveRecords(account) {
  const known = peekSelfService(account) ?? peekLeaveSummary(account)
  const res =
    known?.status === STATUS.ready ? known : await loadLeaveSummary(account).catch(() => null)
  return res?.status === STATUS.ready ? (res.data?.leaves ?? null) : null
}

/**
 * Otomatik yanıt + (gerekirse) bugün izinde mi. ERP'ye YALNIZ otomatik yanıt süresiz ya da
 * bitişi geçmişken sorulur — hatırlatma o zaman söz konusu; sonuç altı saat önbellekte.
 */
async function fetchBriefOof(instance, account) {
  const res = await fetchOwnOof(instance, account)
  if (res.status !== STATUS.ready) return res
  const now = Date.now()
  const onLeave = oofReminder(res.data, null, now)
    ? onLeaveToday(await leaveRecords(account), now)
    : null
  return { status: STATUS.ready, data: { ...res.data, onLeave } }
}

/** Brifingin "Otomatik yanıtın hâlâ açık" satırı gösterilsin mi (`features/widgets/lib/oofHealth` › `oofReminder`). */
export function useBriefOof(now) {
  const res = useWidgetData("own-oof", fetchBriefOof, OOF_TTL)
  return res.status === STATUS.ready && oofReminder(res.data, res.data.onLeave, now)
}
