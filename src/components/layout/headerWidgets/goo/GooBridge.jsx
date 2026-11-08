import { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { motion } from "motion/react"
import { boxOf, insetBox, localBox, opaqueFill, unionBox } from "./gooModel"

// Bulanıklık payı (filtre şekillerin bu kadar dışına taşar) ve kartın düz zemin arayacağı derinlik.
const PAD = 30
const DEPTH = 5
// Açılış tasarımın yayı (hafif sekme), kapanış sakin; kapanınca şekiller bu kadar sonra kalkar.
const OPEN = { type: "spring", bounce: 0.2, duration: 0.4 }
const CLOSE = { type: "spring", bounce: 0, duration: 0.28 }
const INSTANT = { duration: 0 }
const CLOSE_MS = 320
// Kart düz ve opak değilse (cam, degrade) şekil açılıştan sonra söner: kartın arkasından görünmesin.
const FADE_AFTER_MS = 520

/** Kartın zemini düz ve opak mı: içerikte zemini olan ilk öğeye bakılır (iskelet de sayılır). */
function solidCard(root, depth = 0) {
  if (!root || depth > DEPTH) return false
  for (const el of root.children) {
    const cs = getComputedStyle(el)
    const painted =
      cs.backgroundImage !== "none" ||
      !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor)
    if (painted) return opaqueFill(cs.backgroundColor, cs.backgroundImage) !== null
    if (solidCard(el, depth + 1)) return true
  }
  return false
}

function measure(trigger, content) {
  const cr = content.getBoundingClientRect()
  if (!cr.width || !cr.height) return null
  const tcs = getComputedStyle(trigger)
  const pill = boxOf(trigger.getBoundingClientRect())
  const panel = insetBox(boxOf(cr), 1)
  const area = unionBox(pill, panel, PAD)
  return {
    area,
    pill: localBox(pill, area),
    panel: localBox(panel, area),
    // Kapsülün açıkken aldığı renk; seçilmiş renkli kapsülde (degrade) uygulamanın vurgu rengi.
    fill: opaqueFill(tcs.backgroundColor, tcs.backgroundImage) ?? "var(--accent)",
    pillR: parseFloat(tcs.borderTopLeftRadius) || 12,
    panelR: parseFloat(getComputedStyle(content).borderTopLeftRadius) || 28,
    solid: solidCard(content),
  }
}

const shape = (b, r) => ({ left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: r })

/**
 * YAPIŞKAN AÇILIŞ (Framer University'nin "Gooey Dropdown"ı): header'daki düğmenin kapsülü sıvı
 * gibi uzayıp pencereye döner; açıkken ikisi ince bir boyunla bağlı kalır, kapanınca pencere
 * kapsüle geri çekilir. SVG filtresi (bulanıklaştır + keskin eşik) YALNIZ arkadaki iki şekle
 * uygulanır: kartın içeriği filtreye girmez, net kalır ve içindeki hareket filtreyi yeniden
 * hesaplatmaz (şekiller açıldıktan sonra durgun). Düğme şekillerin üstüne alınır (simge görünür).
 */
export function GooBridge({ open, triggerRef, contentRef }) {
  const filterId = `tyro-goo-${useId().replace(/:/g, "")}`
  const [geo, setGeo] = useState(null)
  const [faded, setFaded] = useState(false)
  // Açılış yayı bitti mi: sonra pencerenin boyu değişirse (içerik değişti) şekil anında izler.
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return undefined
    if (!open) {
      // Kapanış: şekil kapsüle döner (aşağıda `animate`), sonra katman kalkar.
      const id = setTimeout(() => {
        setGeo(null)
        setFaded(false)
        setSettled(false)
        trigger.style.zIndex = ""
      }, CLOSE_MS)
      return () => clearTimeout(id)
    }
    let raf = 0
    let ro = null
    const read = () => {
      const content = contentRef.current
      const next = content && measure(trigger, content)
      if (!next) {
        raf = requestAnimationFrame(read)
        return
      }
      setGeo(next)
      if (!ro && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          const again = contentRef.current && measure(trigger, contentRef.current)
          if (again) setGeo(again)
        })
        ro.observe(content)
      }
    }
    // Düğme (simgesi) şekillerin üstünde; header bir yığın bağlamı kurmadığı için kökte yükselir.
    if (getComputedStyle(trigger).position === "static") trigger.style.position = "relative"
    trigger.style.zIndex = "51"
    raf = requestAnimationFrame(read)
    const fade = setTimeout(() => {
      const content = contentRef.current
      if (content && !solidCard(content)) setFaded(true)
    }, FADE_AFTER_MS)
    window.addEventListener("resize", read)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fade)
      ro?.disconnect()
      window.removeEventListener("resize", read)
    }
  }, [open, triggerRef, contentRef])

  // Sayfadan çıkarken düğme eski hâline.
  useEffect(() => {
    const trigger = triggerRef.current
    return () => {
      if (trigger) trigger.style.zIndex = ""
    }
  }, [triggerRef])

  if (!geo || typeof document === "undefined") return null
  const { area, pill, panel, fill, pillR, panelR } = geo
  // Düz zeminli olmayan kartta (cam, degrade) şekil söner ve kapanışta da görünmez.
  const hidden = faded || !geo.solid
  return createPortal(
    <>
      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          left: area.x,
          top: area.y,
          width: area.w,
          height: area.h,
          zIndex: 49,
          pointerEvents: "none",
          // Hafif gölge: açık temada beyaz sayfada açık gri şekil de okunsun.
          filter: `url(#${filterId}) drop-shadow(0 8px 20px rgb(15 23 42 / 0.12))`,
        }}
      >
        <div style={{ position: "absolute", background: fill, ...shape(pill, pillR) }} />
        <motion.div
          initial={shape(pill, pillR)}
          animate={open ? shape(panel, panelR) : shape(pill, pillR)}
          transition={open ? (settled ? INSTANT : OPEN) : CLOSE}
          onAnimationComplete={() => open && setSettled(true)}
          style={{ position: "absolute", background: fill }}
        />
      </motion.div>
    </>,
    document.body,
  )
}
