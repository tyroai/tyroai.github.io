import { useEffect, useId, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BTN, BTN_FILL } from "./heldButton"
import { ScenePin } from "./ScenePin"
import { SceneVisual } from "./SceneVisual"

const OUT = { duration: 0.12, ease: [0.4, 0, 1, 1] }
const SPRING = (duration, bounce, delay) => ({ type: "spring", duration, bounce, delay })

/**
 * Kartın elden ele geçişi, sahneye göre: köşe ve kenar sahnelerinde küreden uzatılır, yükselen
 * ailede küre çıktıktan sonra başına konur, süzülen sahnede önce kart gelir. Çıkışta kart
 * küreye geri alınır. `delay` ilk açılışın zıplamasını bekletir.
 */
function cardMotion(preset, kind, tilt, rtl, delay) {
  const toward = (preset === "mirror" || preset === "mirrorUp") !== rtl ? -6 : 6
  const base = { opacity: 1, x: 0, y: 0, scale: 1, rotate: tilt }
  const d = (x) => delay ?? x
  switch (preset) {
    case "carry":
      return {
        initial: { opacity: 0, y: -12, rotate: 0 },
        animate: base,
        exit: { opacity: 0, y: -6, transition: OUT },
        transition: SPRING(0.4, 0.3, d(0.2)),
      }
    case "tuck":
      return kind === "tomorrow"
        ? {
            initial: { opacity: 0, y: -8 },
            animate: base,
            exit: { opacity: 0, transition: OUT },
            transition: { duration: 0.32, ease: "easeOut", delay: d(0.2) },
          }
        : {
            initial: { opacity: 0, y: -10, rotate: rtl ? 2 : -2 },
            animate: base,
            exit: { opacity: 0, y: -6, transition: OUT },
            transition: SPRING(0.4, 0.3, d(0.22)),
          }
    case "speak":
      return {
        initial: { opacity: 0, scale: 0.88, y: 8 },
        animate: base,
        exit: { opacity: 0, scale: 0.94, y: 6, transition: OUT },
        transition: SPRING(0.3, 0.18, d(0.22)),
      }
    case "float":
      return {
        initial: { opacity: 0, y: 14 },
        animate: base,
        exit: { opacity: 0, y: 8, transition: OUT },
        transition: SPRING(0.34, 0.1, d(0)),
      }
    case "side":
      return {
        initial: { opacity: 0, x: rtl ? 8 : -8, scale: 0.96, rotate: 0 },
        animate: base,
        exit: { opacity: 0, x: toward, transition: OUT },
        transition: SPRING(0.36, 0.14, d(0.08)),
      }
    default:
      return {
        initial: { opacity: 0, y: 12, scale: 0.96, rotate: 0 },
        animate: base,
        exit: {
          opacity: 0,
          x: preset === "stack" ? 0 : toward,
          y: 6,
          scale: 0.98,
          transition: OUT,
        },
        transition: SPRING(0.36, 0.14, d(preset === "stack" ? 0.16 : 0.08)),
      }
  }
}

const GHOSTS = [
  { x: 5, y: 5, rotate: 2.5, opacity: 0.72, delay: 0.08 },
  { x: -4, y: 9, rotate: -3, opacity: 0.5, delay: 0.12 },
]

/**
 * Maskotun uzattığı sahne kartı: üst satır (kaş + ok), tek bakışlık başlık, alt satır, görsel
 * ve tek düğme. Boyu ölçülmez, sahnenin rem bütçesi (`sceneLayout`) satırları seçer. Kartın
 * metni ekran okuyucudan gizli; düğme önerinin tam cümlesini ve ne yapacağını (`tip`, fareyle
 * üstüne gelince balonda) açıklama olarak taşır. Karta basmak (yazıya) alttaki büyük düğmeye
 * düşer: sohbet açılır.
 */
export function SceneCard({
  layout,
  copy,
  visual,
  kind,
  next,
  describe,
  tip,
  onAct,
  rtl,
  reduce,
  delay,
  nowrap,
  locale,
}) {
  const { card, preset } = layout
  const descId = useId()
  const actRef = useRef(null)
  const tilt = reduce ? 0 : card.tilt
  const m = cardMotion(preset, kind, tilt, rtl, delay)
  const anim = reduce
    ? {
        initial: false,
        animate: { opacity: 1, rotate: 0 },
        exit: { opacity: 0, transition: { duration: 0 } },
      }
    : m
  const supLines = card.rows.includes("sup2") ? 2 : 1
  const showSup = copy.sup && card.rows.some((r) => r.startsWith("sup"))
  const showVis = visual && card.rows.includes("vis")
  // Görsel, satır listesinde alt satırdan önceyse önce çizilir (köprü: gün şeridi, sonra izin günü).
  const supAt = card.rows.findIndex((r) => r.startsWith("sup"))
  const visFirst = supAt >= 0 && card.rows.indexOf("vis") >= 0 && card.rows.indexOf("vis") < supAt

  // Geliştirmede: düğmenin adı payına sığmadıysa söyle (bütçe yanlış demektir).
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const el = actRef.current
    if (el && el.scrollWidth > el.clientWidth + 1)
      console.warn(`[orb] ${kind}: düğme metni kesildi (${card.actionMax}px)`)
  }, [kind, card.actionMax, copy.act])

  const place = {
    left: card.x,
    width: card.width,
    ...(card.anchor === "top" ? { top: card.top } : { bottom: `calc(100% - ${card.bottom}px)` }),
    // Kurulum kartının oranı: kartın dibi kürenin tepesine biner, düğme dipte.
    height: card.height,
  }
  const origin = { transformOrigin: card.origin }

  return (
    <div
      className={kind === "weekWrap" && !reduce ? "orb-card-wrap orb-wobble" : "orb-card-wrap"}
      style={place}
    >
      {preset === "stack" &&
        GHOSTS.map((g, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="orb-ghost"
            initial={reduce ? false : { opacity: 0, y: 10, rotate: 0, scale: 0.96 }}
            animate={{
              opacity: g.opacity,
              x: rtl ? -g.x : g.x,
              y: g.y,
              rotate: reduce ? 0 : rtl ? -g.rotate : g.rotate,
              scale: 1,
            }}
            exit={{ opacity: 0, transition: reduce ? { duration: 0 } : OUT }}
            transition={SPRING(0.32, 0.12, delay ?? g.delay)}
          />
        ))}
      <motion.div {...anim} style={origin} className="orb-card">
        <ScenePin />
        <div>
          <div className="orb-kicker-row">
            <p aria-hidden="true" className="orb-kicker">
              {copy.kicker}
            </p>
          </div>
          <p
            aria-hidden="true"
            className="orb-lead"
            data-nowrap={nowrap ? "" : undefined}
            style={{ "--lines": card.leadLines }}
          >
            {copy.main.text ?? (
              <>
                <span className="orb-num">{copy.main.num}</span>{" "}
                <span className="orb-unit">{copy.main.unit}</span>
              </>
            )}
          </p>
          {visFirst && showVis && <SceneVisual visual={visual} locale={locale} />}
          {showSup &&
            (copy.sup.chips ? (
              <p aria-hidden="true" className="orb-chips">
                {copy.sup.chips.meetings != null && (
                  <span>
                    <HugeiconsIcon icon={Calendar03Icon} size={12} strokeWidth={2} />
                    {copy.sup.chips.meetings}
                  </span>
                )}
                {copy.sup.chips.tasks != null && (
                  <span>
                    <HugeiconsIcon icon={CheckListIcon} size={12} strokeWidth={2} />
                    {copy.sup.chips.tasks}
                  </span>
                )}
              </p>
            ) : (
              <p
                aria-hidden="true"
                className="orb-sup"
                data-tone={copy.sup.tone}
                style={{ "--lines": supLines }}
              >
                {copy.sup.text}
              </p>
            ))}
          {!visFirst && showVis && <SceneVisual visual={visual} locale={locale} />}
          <div className="orb-act" data-align={card.actionAlign}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  ref={actRef}
                  type="button"
                  onClick={onAct}
                  aria-describedby={descId}
                  // Ok düğmenin yanında (ürün sahibi): onun yeri (2 rem + aralık) düğmenin payından düşer.
                  style={{
                    maxWidth: next ? `calc(${card.actionMax}px - 2.375rem)` : card.actionMax,
                  }}
                  className={`${BTN} ${BTN_FILL} pointer-events-auto whitespace-nowrap`}
                >
                  <HugeiconsIcon
                    icon={copy.icon}
                    className="size-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="truncate">{copy.act}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[0.75rem]">
                {tip}
              </TooltipContent>
            </Tooltip>
            {next}
            <span id={descId} className="sr-only">
              {describe} {tip}
            </span>
          </div>
        </div>
        {card.tailX != null && (
          <svg
            aria-hidden="true"
            viewBox="0 0 8 6"
            className="orb-tail"
            style={{ left: card.tailX }}
          >
            <path d="M0 0h8L4 6z" />
          </svg>
        )}
      </motion.div>
    </div>
  )
}
