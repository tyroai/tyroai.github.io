import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AutoHeight } from "@/components/common/AutoHeight"
import { SpecialDaysPanel } from "../special-days/SpecialDaysPanel"
import { BellInbox } from "./BellInbox"

// Görünüm değişimi yönlü: ileri (takvim) sağdan girer, geri dönüş soldan; çıkış kısa ve yerini
// hemen bırakır (`popLayout`), kabın boyu aynı sürede yeni içeriğe kayar (`AutoHeight` + CSS).
// Azaltılmış harekette yalnız solma.
const EASE = [0.23, 1, 0.32, 1]
const VIEW = {
  enter: ({ dir, reduce }) => ({ opacity: 0, x: reduce ? 0 : dir * 16 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.2, ease: EASE } },
  exit: ({ dir, reduce }) => ({
    opacity: 0,
    x: reduce ? 0 : dir * -10,
    transition: { duration: 0.09, ease: EASE },
  }),
}

/**
 * BİLDİRİM PANELİNİN İÇİ: iki görünüm — Bildirimler (`BellInbox`) ve özel günler takvimi
 * (`SpecialDaysPanel`). Pencere ya da çekmece kapanınca içi söküldüğünden her açılış listeyle
 * başlar. Takvime geçince odak Geri düğmesine, dönünce takvimi açan satıra gider. Telefonda
 * çekmecenin kendisi yüzey: panel yalnız düzen, kaydırma çekmecenin gövdesinde.
 */
export function BellPanel({ mobile, data, feed, feedOpen, notice, onClose }) {
  const reduce = useReducedMotion()
  const [view, setView] = useState("inbox")
  const [day, setDay] = useState(null)
  const box = useRef(null)
  // Takvimi açan öğe (alt satır ya da bir tatil): dönüşte odak ona.
  const opener = useRef("calendar")
  const moved = useRef(false)
  const custom = { dir: view === "calendar" ? 1 : -1, reduce }

  const toTop = (smooth) => {
    const root = box.current
    const scroller = mobile ? root?.parentElement : root?.querySelector(".bn-body")
    scroller?.scrollTo?.({ top: 0, behavior: smooth && !reduce ? "smooth" : "auto" })
  }

  const openCalendar = (pick, key) => {
    opener.current = key
    moved.current = true
    setDay(pick)
    setView("calendar")
  }
  const back = () => {
    moved.current = true
    setView("inbox")
  }

  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    const root = box.current
    if (!root) return
    if (mobile) root.parentElement?.scrollTo?.({ top: 0 })
    const target =
      view === "calendar"
        ? root.querySelector("[data-bn-back]")
        : root.querySelector(`[data-bn-focus="${opener.current}"]`)
    target?.focus({ preventScroll: true })
  }, [view, mobile])

  return (
    <AutoHeight
      ref={box}
      className="bn-panel"
      data-view={view}
      data-mobile={mobile ? "" : undefined}
    >
      <AnimatePresence mode="popLayout" initial={false} custom={custom}>
        <motion.div
          key={view}
          className="bn-view"
          custom={custom}
          variants={VIEW}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {view === "inbox" ? (
            <BellInbox
              mobile={mobile}
              data={data}
              feed={feed}
              feedOpen={feedOpen}
              notice={notice}
              onClose={onClose}
              onCalendar={openCalendar}
            />
          ) : (
            <SpecialDaysPanel
              {...data}
              initialDay={day}
              mobile={mobile}
              onBack={back}
              toTop={toTop}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </AutoHeight>
  )
}
