import { AnimatePresence, motion, useReducedMotion } from "motion/react"

const SPRING = { type: "spring", stiffness: 520, damping: 38, mass: 0.6 }

/**
 * Değişen değer yerinde kayar (iOS'un sayılarındaki gibi): yalnız değişen karakter oynar — eski
 * yukarı çıkar, yeni aşağıdan gelir. Azaltılmış harekette düz metin. Görünen kopya süs; değerin
 * kendisi ekran okuyucuda (`sr-only`), kayarken iki kez okunmasın.
 */
export function RollText({ text }) {
  const reduce = useReducedMotion()
  const value = String(text ?? "")
  if (reduce) return value
  const chars = [...value]
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((c, i) => (
          <span key={`${chars.length}:${i}`} className="relative inline-flex overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={c}
                className="inline-block"
                initial={{ y: "0.8em", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-0.8em", opacity: 0 }}
                transition={SPRING}
              >
                {c === " " ? "\u00a0" : c}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
    </>
  )
}
