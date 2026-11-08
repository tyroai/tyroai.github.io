import { useCallback, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { detectLanguage, pickTarget, translateOnDevice } from "@/lib/onDeviceTranslate"

const IDLE = { status: "idle" }

/**
 * Çeviri durumu: `idle` · `working` (`progress`: dil paketi iniyorsa 0–1; dil biliniyorsa `source`,
 * `target`) · `done` (`source`, `target`, `text`) · `unknown` (dil anlaşılamadı) · `unsupported`
 * (çift cihazda yok) · `error`.
 * Sonradan başlayan çeviri öncekinin sonucunu geçersiz kılar (hedef dil değişince).
 */
export function useTranslate() {
  const { locale } = useLocale()
  const [state, setState] = useState(IDLE)
  const runRef = useRef(0)

  const run = useCallback(
    async (text, { source: knownSource, target: wanted } = {}) => {
      const id = ++runRef.current
      const live = () => id === runRef.current
      setState({ status: "working", progress: null, source: knownSource, target: wanted })
      try {
        const progress = (p) => live() && setState((x) => ({ ...x, progress: p }))
        const source = knownSource ?? (await detectLanguage(text, progress))
        if (!live()) return
        if (!source) return setState({ status: "unknown" })
        const target = wanted ?? pickTarget(source, locale)
        setState({ status: "working", progress: null, source, target })
        if (source === target) return setState({ status: "done", source, target, text })
        const out = await translateOnDevice(text, {
          source,
          target,
          onProgress: progress,
        })
        if (!live()) return
        setState(
          out == null
            ? { status: "unsupported", source, target }
            : { status: "done", source, target, text: out },
        )
      } catch {
        if (live()) setState({ status: "error" })
      }
    },
    [locale],
  )

  const reset = useCallback(() => {
    runRef.current++
    setState(IDLE)
  }, [])

  return { state, run, reset }
}
