import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import LockKeyIcon from "@hugeicons/core-free-icons/LockKeyIcon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { Button } from "@/components/ui/button"
import { createRequest } from "@/lib/authorizations"
import { causeNote } from "@/lib/causeText"
import { isMsalConfigured, msalInstance } from "@/lib/msal"
import { notify } from "@/lib/notify"
import { RM_APP } from "@/features/rm/lib/rmPolicy"
import { useRmText } from "../data/useRmText"
import { returnPath } from "./views"

/** Yetkisiz ya da yetkisi okunamayan kişi: ret değil, bir sonraki adım. */
export function RmAccessGate({ state, detail }) {
  const { rt, t } = useRmText()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const unknown = state === "unknown"

  async function request() {
    const upn = isMsalConfigured ? (msalInstance.getActiveAccount()?.username ?? null) : null
    if (!upn || busy) return
    setBusy(true)
    try {
      const { created } = await createRequest(upn, RM_APP, "")
      setSent(true)
      notify.success(created ? t("lock.requested") : t("lock.alreadyRequested"))
    } catch (err) {
      notify.error(t("lock.requestFailed"), { description: causeNote(t, "dataverse", err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <HugeiconsIcon icon={LockKeyIcon} className="size-6" strokeWidth={1.7} />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          {rt(unknown ? "rm.gate.unknownTitle" : "rm.gate.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {rt(unknown ? "rm.gate.unknownBody" : "rm.gate.body")}
        </p>
        {unknown && <ErrorCause detail={detail} className="mt-0" />}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(returnPath())}>
            {rt("rm.nav.back")}
          </Button>
          {unknown ? (
            <Button onClick={() => window.location.reload()}>{rt("rm.action.retry")}</Button>
          ) : (
            <Button
              onClick={request}
              disabled={busy || sent}
              className="bg-brand-fill-deep text-brand-on-brand hover:bg-brand-fill-deep hover:brightness-110"
            >
              {rt(sent ? "rm.gate.sent" : "rm.gate.request")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
