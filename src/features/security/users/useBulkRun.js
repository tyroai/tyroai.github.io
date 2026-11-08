import { useCallback, useRef, useState } from "react"
import { updateAuthorizedApps } from "@/lib/authorizations"
import { runQueue } from "@/features/security/lib/authzBulk"
import { errorCause } from "@/lib/errorCause"

const IDLE = {
  phase: "idle",
  done: 0,
  total: 0,
  ok: [],
  failed: [],
  cancelled: [],
  failDetail: null,
}

/**
 * Toplu yazmanın koşucusu: planın değişikliklerini en çok 4 eşzamanlı yazar (satır başına mevcut
 * `updateAuthorizedApps`), ilerlemeyi sayar, durdurulabilir; bitince listeyi BİR KEZ tazeler.
 * Hata alanlar "Tekrar dene" ile yalnız onları yeniden dener.
 */
export function useBulkRun(reload) {
  const [state, setState] = useState(IDLE)
  const abortRef = useRef(null)

  const start = useCallback(
    // `retry`: önceki turun başarılıları sonuçta kalır (tekrar denenen yalnız hatalılar).
    async (changes, { retry = false } = {}) => {
      const controller = new AbortController()
      abortRef.current = controller
      setState((s) => ({ ...IDLE, ok: retry ? s.ok : [], phase: "running", total: changes.length }))
      const { results, cancelled } = await runQueue(
        changes,
        (c) => updateAuthorizedApps(c.id, c.after),
        {
          limit: 4,
          signal: controller.signal,
          onProgress: (done) => setState((s) => ({ ...s, done })),
        },
      )
      abortRef.current = null
      const failed = results.find((r) => !r.ok)
      try {
        await reload()
      } catch {
        // Tazeleme düşerse liste kendi hata şeridini gösterir; sonuç yine söylenir.
      }
      setState((s) => ({
        ...s,
        phase: "done",
        ok: [...s.ok, ...results.filter((r) => r.ok).map((r) => r.item)],
        failed: results.filter((r) => !r.ok).map((r) => r.item),
        cancelled,
        // İlk hatanın neden kodu: aynı yetki eksiği hepsinde aynı nedenle düşer.
        failDetail: failed ? errorCause("dataverse", failed.error) : null,
      }))
    },
    [reload],
  )

  const cancel = useCallback(() => abortRef.current?.abort(), [])
  const reset = useCallback(() => setState(IDLE), [])
  return { state, start, cancel, reset }
}
