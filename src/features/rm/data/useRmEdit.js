import { useCallback, useSyncExternalStore } from "react"
import { causeNote } from "@/lib/causeText"
import { DV_FORBIDDEN, DV_SESSION_EXPIRED } from "@/lib/dataverse"
import { notify } from "@/lib/notify"
import { RM_CONFLICT } from "@/features/rm/lib/docStore"
import { commitEdit, subscribeUndo, undoDepth, undoLast } from "@/features/rm/lib/edit/writer"
import { useRmText } from "./useRmText"

/** Yazma hatasının kullanıcı metni anahtarı. */
export function editErrorKey(err) {
  if (err?.code === DV_FORBIDDEN) return "rm.edit.err.forbidden"
  if (err?.code === DV_SESSION_EXPIRED) return "rm.edit.err.session"
  if (err?.code === RM_CONFLICT) return "rm.edit.err.conflict"
  return "rm.edit.err.failed"
}

/**
 * Düzenleme kapısı: `commit(fn, label, { quiet })` planın kopyasını `fn` ile değiştirip yazar ve
 * "Geri al"lı bildirim gösterir; hata çağırana fırlar (pencere kendi içinde gösterir:
 * `editError` satır içi metin, `editToast` bildirim).
 */
export function useRmEdit() {
  const { rt, t } = useRmText()
  const depth = useSyncExternalStore(subscribeUndo, undoDepth)

  // Hata metni: kullanıcı cümlesi + neden cümlesi ve kodu (satır içi kutular) ya da bildirim.
  const note = useCallback((err) => causeNote(t, "dataverse", err), [t])
  const editError = useCallback(
    (err) => [rt(editErrorKey(err)), note(err)].filter(Boolean).join(" "),
    [rt, note],
  )
  const editToast = useCallback(
    (err) => notify.error(rt(editErrorKey(err)), { description: note(err) }),
    [rt, note],
  )

  const undo = useCallback(async () => {
    try {
      const label = await undoLast()
      if (label) notify.info(rt("rm.edit.undone"), { description: label })
    } catch (err) {
      if (err?.code === RM_CONFLICT) notify.error(rt("rm.edit.undoConflict"))
      else editToast(err)
    }
  }, [rt, editToast])

  const commit = useCallback(
    async (fn, label, { quiet = false } = {}) => {
      const { merged } = await commitEdit(fn, label, rt("rm.edit.snapNote", { label }))
      // Küçük, kendini gösteren değişiklik (iş işaretleme) bildirim çıkarmaz.
      if (quiet && !merged) return
      notify.success(label, {
        description: merged ? rt("rm.edit.merged") : undefined,
        action: { label: rt("rm.edit.undo"), onClick: undo },
      })
    },
    [rt, undo],
  )

  return { commit, undo, canUndo: depth > 0, editError, editToast }
}
