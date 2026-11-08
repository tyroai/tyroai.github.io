import { useEffect } from "react"
import { onEdit, takeEdit } from "@/lib/requestEdits"
import { TABS } from "./kinds"
import { useRequestOpener } from "./useRequestOpener"

/** "YYYY-AA-GG" → yerel gün; bozuksa null. */
function dayOf(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "")
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3])
  return d.getMonth() === +m[2] - 1 ? d : null
}

/**
 * Self Servis'in talep penceresi ve Temsilci ata penceresi: açış `useRequestOpener`da (`onNew`);
 * burada yalnız bu sayfaya özgü iki kapı:
 * - Sohbetteki talep kartının "Formda düzenle"si: gönderilen form dolu açılır.
 * - Adresteki `?new=leave|expense|advance` (Anasayfa'daki İzin bakiyem kartı): veri hazır olunca
 *   form bir kez açılır; izinde `&day=YYYY-AA-GG` o günle dolu (kartın köprü önerisi).
 *   Parametreler silinir — yenileyince yeniden açılmaz.
 */
export function useRequestDialogs({ status, params, setParams }) {
  const { form, setForm, delegate, setDelegate, onNew, seqRef } = useRequestOpener()

  useEffect(() => {
    const openEdit = () => {
      const edit = takeEdit()
      if (!edit) return
      setForm({
        kind: edit.kind,
        seq: ++seqRef.current,
        from: null,
        initial: edit.initial,
        origin: { type: "edit", missing: edit.missing },
      })
    }
    openEdit()
    return onEdit(openEdit)
  }, [setForm, seqRef])

  // Kayıt okunamadıysa (yetki yok, çalışan kaydı yok) form açılmaz; parametre yine silinir.
  const wanted = params.get("new")
  const day = params.get("day")
  useEffect(() => {
    if (!wanted || status === "loading") return
    if (status === "ready" && TABS.some((x) => x.id === wanted)) {
      const on = wanted === "leave" ? dayOf(day) : null
      onNew(wanted, null, on ? { values: { start: on, end: on } } : null)
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete("new")
        next.delete("day")
        return next
      },
      { replace: true },
    )
  }, [wanted, day, status, onNew, setParams])

  return { form, setForm, delegate, setDelegate, onNew }
}
