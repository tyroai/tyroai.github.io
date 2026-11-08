import { useRef, useState } from "react"
import { DELEGATE } from "@/features/selfservice/lib/delegatePolicy"
import { submitDelegate } from "@/features/selfservice/lib/delegateSubmit"

/**
 * Temsilci atamanın "ERP'ye gönder"i — `useErpSubmit` ile aynı sözleşme (`ErpConfirm` ikisini de
 * çizer): `state.phase` "confirm" · "writing" · "done" · "error". `start(plan)` onayla başlar;
 * `{ direct: true }` onayı atlar (izin penceresinde form zaten aynı pencerede, yeni bir onay
 * gereksiz). Kapanış: yazım sürerken yok; işlendikten sonra `onDone(sonuç)`.
 */
export function useDelegateErp({ onDone } = {}) {
  const [state, setState] = useState(null)
  const running = useRef(false)

  const run = async (plan) => {
    if (running.current) return
    running.current = true
    setState({ phase: "writing", plan, files: [], step: null })
    try {
      const result = await submitDelegate(plan, {
        demo: DELEGATE.demo,
        onStep: (name) => setState((s) => ({ ...s, step: { name } })),
      })
      setState((s) => ({ ...s, phase: "done", result }))
    } catch (e) {
      setState((s) => ({
        ...s,
        phase: "error",
        error: { kind: e?.kind ?? "error", message: e?.message ?? "", code: e?.code ?? null },
      }))
    } finally {
      running.current = false
    }
  }

  const start = (plan, { direct = false } = {}) => {
    if (direct) run(plan)
    else setState({ phase: "confirm", plan, files: [] })
  }
  const confirm = () => state?.phase === "confirm" && run(state.plan)
  const cancel = () => {
    const phase = state?.phase
    if (phase === "writing") return
    const result = state?.result
    setState(null)
    if (phase === "done") onDone?.(result)
  }
  return { state, start, confirm, cancel }
}
