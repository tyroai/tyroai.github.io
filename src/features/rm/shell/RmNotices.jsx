import { HugeiconsIcon } from "@hugeicons/react"
import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { Button } from "@/components/ui/button"
import { errorCause } from "@/lib/errorCause"
import { stamp } from "@/features/rm/lib/format"
import { useRmText } from "../data/useRmText"
import { useRm } from "./RmContext"

function Strip({ tone = "info", icon, children, action }) {
  return (
    <div
      role="status"
      className={
        tone === "warn"
          ? "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-warning/10 px-4 py-2.5 text-sm text-warning-ink"
          : "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-muted/60 px-4 py-2.5 text-sm dark:bg-white/[0.05]"
      }
    >
      <HugeiconsIcon icon={icon} className="size-4 shrink-0" strokeWidth={1.8} />
      <span dir="auto" className="min-w-0 flex-1">
        {children}
      </span>
      {action}
    </div>
  )
}

/** Bölüm uyarısı sayfada değil burada: plan yenilenemedi (yeni sürüm kendiliğinden yüklenir). */
export function RmNotices() {
  const { rt, locale } = useRmText()
  const { data } = useRm()
  const refreshing = data.status === "refreshing"
  return (
    <>
      {data.error && data.status === "ready" && data.meta && (
        <Strip
          tone="warn"
          icon={AlertCircleIcon}
          action={
            <Button size="sm" variant="outline" onClick={data.reload} disabled={refreshing}>
              {rt("rm.action.retry")}
            </Button>
          }
        >
          {rt("rm.notice.refreshFailed", { time: stamp(data.meta.modifiedOn, locale) })}
          <ErrorCause detail={errorCause("dataverse", data.error)} className="mt-1.5" />
        </Strip>
      )}
    </>
  )
}
