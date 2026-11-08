import { useCallback, useMemo, useState } from "react"
import { toIso } from "@/lib/rm/engine/dates"
import { autoCode, blankProject, projectErrors, todoOf } from "@/features/rm/lib/edit/project"
import { uid } from "@/features/rm/lib/edit/ops"

function fromProject(p) {
  return {
    code: p.code || "",
    name: p.name || "",
    cats: (p.cats || []).slice(),
    country: p.country || "TR",
    prio: p.prio || "",
    status: p.status || "",
    start: p.start || "",
    end: p.end || "",
    sponsor: p.sponsor || "",
    // "Belirlenecek" seçilmemiş demek (şartname): listede "— Seçilmedi —".
    pm: p.pm === "Belirlenecek" ? "" : p.pm || "",
    desc: p.desc || "",
    todo: todoOf(p),
  }
}

/**
 * Proje formunun durumu. Yeni projede kod, ad yazıldıkça boş bir koddan önerilir (kişi kodu
 * kendisi yazana dek). `pre`: simülasyondan gelen başlangıç değerleri (tarihler, kategoriler,
 * ekip). Hatalar ilk kaydetme denemesinden sonra gösterilir (`shown`).
 */
export function useProjectForm({ st, plan, pid, pre = null }) {
  const p = pid ? st.projects.find((x) => x.id === pid) : null
  const [f, setF] = useState(() =>
    p ? fromProject(p) : { ...blankProject(st, toIso(plan.start)), ...(pre || {}) },
  )
  // Simülasyon kodu kategoriden önerir: ad yazıldıkça değişmesin.
  const [codeTouched, setCodeTouched] = useState(Boolean(p || pre?.code))
  const [shown, setShown] = useState(false)
  const errors = useMemo(() => projectErrors(st, pid, f), [st, pid, f])

  const set = useCallback(
    (k, v) =>
      setF((prev) => {
        const next = { ...prev, [k]: v }
        if (k === "name" && !codeTouched) next.code = v.trim() ? autoCode(st, v) : ""
        return next
      }),
    [st, codeTouched],
  )
  const setCode = useCallback((v) => {
    setCodeTouched(true)
    setF((prev) => ({ ...prev, code: v.toUpperCase().slice(0, 6) }))
  }, [])
  const toggleCat = useCallback(
    (name) =>
      setF((prev) => ({
        ...prev,
        // Seçim sırası korunur: ilk seçilen kategori projenin rengini verir.
        cats: prev.cats.includes(name) ? prev.cats.filter((c) => c !== name) : [...prev.cats, name],
      })),
    [],
  )
  const todo = useMemo(
    () => ({
      add: (text) =>
        setF((prev) => ({
          ...prev,
          todo: [
            ...prev.todo,
            ...text
              .split(/\n|;/)
              .map((x) => x.trim())
              .filter(Boolean)
              .map((t) => ({ id: uid(), t, d: false })),
          ],
        })),
      edit: (id, patch) =>
        setF((prev) => ({
          ...prev,
          todo: prev.todo.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      remove: (id) => setF((prev) => ({ ...prev, todo: prev.todo.filter((x) => x.id !== id) })),
      up: (id) =>
        setF((prev) => {
          const i = prev.todo.findIndex((x) => x.id === id)
          if (i <= 0) return prev
          const next = prev.todo.slice()
          ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
          return { ...prev, todo: next }
        }),
    }),
    [],
  )

  return {
    p,
    f,
    set,
    setCode,
    toggleCat,
    todo,
    errors,
    shown,
    show: () => setShown(true),
    valid: Object.keys(errors).length === 0,
  }
}
