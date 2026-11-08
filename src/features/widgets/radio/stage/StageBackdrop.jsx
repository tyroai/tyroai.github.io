import { AnimatePresence, motion } from "motion/react"

/**
 * Kartın içindeki zemin: görsel kartı boşluksuz kaplar ve yalnız gerektiği kadar kesilir (görseller
 * özgün oranında); kesim görselin odağına göre (`pos`). Görsel değişince çapraz geçiş.
 */
export function StageBackdrop({ art }) {
  return (
    <AnimatePresence initial={false}>
      <motion.img
        key={art.src}
        src={art.src}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
        className="stage-bg"
        style={{ objectPosition: art.pos }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
    </AnimatePresence>
  )
}

/** Kartın dışına taşan ışık: aynı görsel, çok bulanık (tasarımın arkasındaki hale). */
export function StageHalo({ src }) {
  return (
    <span aria-hidden="true" className="stage-halo">
      <img key={src} src={src} alt="" decoding="async" draggable={false} />
    </span>
  )
}
