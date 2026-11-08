import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Download01Icon from "@hugeicons/core-free-icons/Download01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { notify } from "@/lib/notify"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"

/**
 * Direktör paketi (Excel). Yazıcı ve paket kodu yalnız tıklanınca iner. Başlıkta sayfa düzeyi
 * ikincil eylem (`ActionButton`); `variant="ghost"` sunum ekranının zeminsiz hali.
 */
export function ExportButton({ variant = "outline", compact = false, className }) {
  const { rt, locale } = useRmText()
  const { data, derived, people, today } = useRm()
  const [busy, setBusy] = useState(false)
  async function run() {
    if (busy || !data.st || !derived) return
    setBusy(true)
    try {
      const [{ directorPack, packFileName }, { workbookBlob, downloadBlob }] = await Promise.all([
        import("@/features/rm/lib/exportPack"),
        import("@/features/rm/lib/xlsxWrite"),
      ])
      const sheets = directorPack({
        st: data.st,
        plan: data.plan,
        derived,
        rt,
        locale,
        people,
        meta: data.meta,
        today,
      })
      downloadBlob(workbookBlob(sheets), packFileName(today))
    } catch {
      notify.error(rt("rm.x.failed"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ActionButton
      tone={variant === "ghost" ? "plain" : "soft"}
      size="toolbar"
      iconOnly={compact}
      onClick={run}
      disabled={busy}
      aria-busy={busy || undefined}
      title={rt("rm.x.exportHint")}
      aria-label={compact ? rt("rm.x.export") : undefined}
      className={className}
    >
      <HugeiconsIcon icon={Download01Icon} strokeWidth={1.8} />
      {!compact && rt("rm.x.export")}
    </ActionButton>
  )
}
