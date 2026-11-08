import { HugeiconsIcon } from "@hugeicons/react"
import Database01Icon from "@hugeicons/core-free-icons/Database01Icon"
import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { Button } from "@/components/ui/button"
import { DV_FORBIDDEN, DV_SESSION_EXPIRED } from "@/lib/dataverse"
import { errorCause } from "@/lib/errorCause"
import { useRmText } from "../data/useRmText"
import { useRm } from "./RmContext"

/** Yüklenirken gerçek boyda iskelet: sayfa kıpırdamasın. */
export function RmLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-16 w-2/3 max-w-xl animate-pulse rounded-2xl bg-muted/60" />
      <div className="grid grid-cols-2 gap-3 @[48rem]/rm:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-muted/40" />
    </div>
  )
}

function Panel({ icon, title, body, cause, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl bg-muted/30 px-6 py-14 text-center dark:bg-white/[0.03]">
      <span className="grid size-11 place-items-center rounded-2xl bg-background text-muted-foreground shadow-xs">
        <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.7} />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p dir="auto" className="text-sm text-muted-foreground">
        {body}
      </p>
      {cause}
      {action}
    </div>
  )
}

/** Plan tabloda yok: düzenleyene içe aktarma yolu, okuyana ne zaman geleceği. */
export function RmEmpty() {
  const { rt } = useRmText()
  const { edit, params } = useRm()
  return (
    <Panel
      icon={Database01Icon}
      title={rt("rm.empty.title")}
      body={rt(edit ? "rm.empty.bodyEdit" : "rm.empty.bodyView")}
      action={
        edit && (
          <Button onClick={() => params.go("ayarlar")} className="mt-1">
            {rt("rm.empty.import")}
          </Button>
        )
      }
    />
  )
}

/** Okunamadı: "yok" ile karışmasın; çaresi kimdeyse onu söyler. */
export function RmError({ error, onRetry }) {
  const { rt } = useRmText()
  const key =
    error?.code === DV_FORBIDDEN
      ? "rm.error.forbidden"
      : error?.code === DV_SESSION_EXPIRED
        ? "rm.error.session"
        : "rm.error.generic"
  return (
    <Panel
      icon={AlertCircleIcon}
      title={rt("rm.error.title")}
      body={rt(key)}
      cause={<ErrorCause detail={error ? errorCause("dataverse", error) : null} className="mt-0" />}
      action={
        <Button variant="outline" onClick={onRetry} className="mt-1">
          {rt("rm.action.retry")}
        </Button>
      }
    />
  )
}
