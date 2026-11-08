import { useCallback, useState } from "react"
import { notify } from "@/lib/notify"
import { colTitle } from "@/features/rm/lib/matrix"
import { useRmText } from "../data/useRmText"

const HEAD = {
  project: "rm.matrix.colProject",
  team: "rm.matrix.colTeam",
  person: "rm.matrix.colPerson",
}

/**
 * Ekrandaki matrisin Excel'i (görünüm, ölçek, aralık, filtre; kapalı gruplar da dahil). Yazıcı
 * yalnız tıklanınca iner. Döner: { busy, run }.
 */
export function useMatrixExcel({ groups, cols, mode, zoom, today }) {
  const { rt, locale } = useRmText()
  const [busy, setBusy] = useState(false)
  const run = useCallback(async () => {
    setBusy(true)
    try {
      const [{ matrixFileName, matrixSheet }, { downloadBlob, workbookBlob }] = await Promise.all([
        import("@/features/rm/lib/matrixExport"),
        import("@/features/rm/lib/xlsxWrite"),
      ])
      const sheet = matrixSheet({
        groups,
        cols,
        head: rt(HEAD[mode]),
        colLabel: (c) => colTitle(c, zoom, locale, rt),
        total: rt("rm.matrix.total"),
        name: rt("rm.nav.matrix"),
      })
      downloadBlob(workbookBlob([sheet]), matrixFileName(today))
    } catch {
      notify.error(rt("rm.x.failed"))
    } finally {
      setBusy(false)
    }
  }, [groups, cols, mode, zoom, today, rt, locale])
  return { busy, run }
}
