import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useRest } from "@/lib/restMode"
import { formatElapsed } from "./discModel"

// Değişen hane bulanıklaşıp küçülerek yukarı çıkar, yenisi alttan netleşerek gelir.
const MORPH = { duration: 0.3, ease: [0.1, 1, 0.45, 1] }
const ENTER = { opacity: 0, y: 4, scale: 0.7, filter: "blur(2px)" }
const SHOW = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
const EXIT = { opacity: 0, y: -4, scale: 0.7, filter: "blur(2px)" }

/**
 * Süre satırı: canlı yayın çizgisi, dinleme süresi (kayan rakamlar) ve "/ CANLI" — canlı yayının
 * sonu yok, şarkının toplam süresi yerine. Dinlenme kipinde rakamlar canlandırılmaz.
 */
export function DiscTime({ since, playing, live }) {
  const [now, setNow] = useState(() => Date.now())
  const rest = useRest()
  useEffect(() => {
    if (!playing || !since) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [playing, since])
  const text = formatElapsed(playing && since ? now - since : 0)
  return (
    <span className="disc-time">
      <span className="disc-line">
        <span />
      </span>
      <span className="disc-digits">
        {[...text].map((ch, i) => (
          <span key={i} className="disc-digit">
            {rest ? (
              ch
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span key={ch} initial={ENTER} animate={SHOW} exit={EXIT} transition={MORPH}>
                  {ch}
                </motion.span>
              </AnimatePresence>
            )}
          </span>
        ))}
      </span>
      <span className="disc-total">/ {live}</span>
    </span>
  )
}
