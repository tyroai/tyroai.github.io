import { useEffect, useRef, useState } from "react"
import { STATUS } from "@/lib/graph"

/**
 * Görevin adımları (kontrol listesi): panel açılınca okunur; ekle · işaretle · adı düzelt · sil
 * iyimser, To Do reddederse geri döner. Okunmuş hâl her değişiklikte satıra da yazılır
 * (`setTaskSteps`): satırın "Adımları göster"i aynı adımları göstersin.
 */
export function useTaskSteps(board, task) {
  const [state, setState] = useState({ status: "loading", steps: [] })

  useEffect(() => {
    let cancelled = false
    board.loadSteps(task).then((res) => {
      if (cancelled) return
      setState(
        res.status === STATUS.ready
          ? { status: "ready", steps: res.steps }
          : { status: "error", steps: [], detail: res.detail },
      )
    })
    return () => {
      cancelled = true
    }
    // Yalnız görev değişince — `board` her render'da yeni bir nesne.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id])

  const patch = (fn) => setState((s) => ({ ...s, steps: fn(s.steps) }))

  async function add(raw) {
    const title = raw.trim().slice(0, 255)
    if (!title) return false
    const temp = { id: `tmp-${Date.now()}`, title, done: false, pending: true }
    patch((steps) => [...steps, temp])
    const res = await board.createStep(task, title)
    patch((steps) =>
      res.status === STATUS.ready
        ? steps.map((x) => (x.id === temp.id ? res.step : x))
        : steps.filter((x) => x.id !== temp.id),
    )
    return true
  }

  async function toggle(step) {
    patch((steps) => steps.map((x) => (x.id === step.id ? { ...x, done: !x.done } : x)))
    const res = await board.changeStep(task, step.id, { done: !step.done })
    if (res.status !== STATUS.ready)
      patch((steps) => steps.map((x) => (x.id === step.id ? step : x)))
  }

  // Adım adının DÜZENLEMEDEN ÖNCEKİ hâli — boş bırakılırsa ya da To Do reddederse ona dönülür.
  const before = useRef({})
  const edit = (stepId, title) =>
    patch((steps) => steps.map((x) => (x.id === stepId ? { ...x, title } : x)))
  const startEdit = (step) => (before.current[step.id] = step.title)

  async function rename(stepId, title) {
    const original = before.current[stepId]
    const revert = () => edit(stepId, original)
    const clean = title.trim().slice(0, 255)
    if (original === undefined || clean === original) return
    if (!clean) return revert()
    const res = await board.changeStep(task, stepId, { title: clean })
    if (res.status !== STATUS.ready) revert()
  }

  async function remove(step) {
    const index = state.steps.findIndex((x) => x.id === step.id)
    patch((steps) => steps.filter((x) => x.id !== step.id))
    const res = await board.removeStep(task, step.id)
    if (res.status !== STATUS.ready)
      patch((steps) => {
        const next = [...steps]
        next.splice(index, 0, step)
        return next
      })
  }

  // Yalnız okunmuş hâl yazılır; geçici kimlikliler dahil.
  const sync = board.setTaskSteps
  useEffect(() => {
    if (state.status === "ready")
      sync?.(
        task.id,
        state.steps.map(({ id, title, done, createdAt, pending }) => ({
          id,
          title,
          done,
          createdAt,
          pending,
        })),
      )
    // `sync` her çizimde yeni olabilir; yalnız adımlar değişince yaz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, task.id])

  return { ...state, add, toggle, edit, startEdit, rename, remove }
}
