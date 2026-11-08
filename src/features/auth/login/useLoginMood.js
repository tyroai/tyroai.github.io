import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import { useOrbIdleState } from "@/hooks/useOrbIdleState"

/** Maskotun selamı (`greet` animasyonu 2,4 sn, bir kez). */
const GREET_MS = 2400

/**
 * Maskotun hâli — adlar maskotun kendi durum listesinden (`mascot.mjs` › agentStates):
 * açılışta selam (`greeting`; maskot o sırada ekranın ortasında büyük), sonra sakin nefes
 * (`idle`: göz kırpar, bakışı imleci izler), 5 sn hareketsizlikte uyku (`sleeping`,
 * `useOrbIdleState` — sayaç selamdan sonra başlar), uyandırınca sevinç zıplaması (`success`,
 * mutlu gözler), Bağlan'da ışık halkası (`logging-in`). Azaltılmış harekette açılış yok.
 */
export function useLoginMood(connecting) {
  const reduce = useReducedMotion()
  const [hello, setHello] = useState(() => !reduce)
  // Selam kendi animasyonu bitince (2,4 sn) biter: maskot o sırada yerine çekiliyor, ifadenin
  // değişimi hareketin içinde kalır. Açılış sonuna (yerine oturduğu ana) denk gelince göze
  // "takılma" gibi geliyordu. Uyku sayacı selamdan sonra başlar.
  useEffect(() => {
    if (!hello) return undefined
    const id = window.setTimeout(() => setHello(false), GREET_MS)
    return () => window.clearTimeout(id)
  }, [hello])
  const idle = useOrbIdleState({ enabled: !hello && !connecting })

  if (connecting) return "logging-in"
  if (idle === "sleeping") return "sleeping"
  if (idle === "greeting") return "success"
  return hello ? "greeting" : "idle"
}
