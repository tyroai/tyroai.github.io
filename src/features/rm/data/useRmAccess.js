import { useMemo } from "react"
import { useGroupFailure, useIsInGroup } from "@/hooks/useIsInGroup"
import { useIsAppAdmin, useMyAuthorizationRow } from "@/hooks/useAuthorizations"
import { readDevAuthBypass } from "@/lib/devAuth"
import { readDevRmRole, RM_EDITOR_GROUP_ID, rmAccessFor } from "@/features/rm/lib/rmPolicy"

/** Bu oturumun tyroRM kararı: { state, edit } (kural `features/rm/lib/rmPolicy.js`). */
export function useRmAccess() {
  const editor = useIsInGroup(RM_EDITOR_GROUP_ID)
  const appAdmin = useIsAppAdmin()
  const { state: authState, row, detail } = useMyAuthorizationRow()
  // Karar "sorulamadı" ise nedeni (tablo ya da grup sorusunun neden kodu): ret değil.
  const groupFailure = useGroupFailure(RM_EDITOR_GROUP_ID)
  const devRole = readDevAuthBypass() ? readDevRmRole() : null
  return useMemo(() => {
    if (devRole === "edit") return { state: "granted", edit: true }
    if (devRole === "view") return { state: "granted", edit: false }
    if (devRole === "none") return { state: "denied", edit: false }
    const verdict = rmAccessFor({ editor, appAdmin, authState, apps: row?.apps ?? [] })
    return verdict.state === "unknown"
      ? { ...verdict, detail: detail ?? groupFailure ?? null }
      : verdict
  }, [devRole, editor, appAdmin, authState, row, detail, groupFailure])
}
