import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { TrayAccess } from "../headerWidgets/HeaderWidgets"
import { isBuiltin, visibleTiles } from "./controlModel"
import { ControlDetail } from "./ControlDetail"
import { ControlEdit } from "./ControlEdit"
import { ControlGrid } from "./ControlGrid"
import { useControlLook, useControlTiles } from "./controlStore"
import { MeetingJoin } from "./MeetingJoin"
import { OofPrompt } from "./OofPrompt"

// Görünüm değişimi: çıkış kısa, giriş yumuşak (ease-out); hareket azaltılmışsa yalnız solma.
const EASE = [0.23, 1, 0.32, 1]

/** "Denetimleri düzenle"; düzenlemeden "Bitti" ile dönülünce odak yeniden burada. */
function EditPill({ label, focusOnMount, onClick }) {
  const ref = useRef(null)
  const [focus] = useState(focusOnMount)
  useEffect(() => {
    if (focus) ref.current?.focus({ preventScroll: true })
  }, [focus])
  return (
    <button ref={ref} type="button" className="cc-pill" onClick={onClick}>
      <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.8} aria-hidden="true" className="size-3.5" />
      {label}
    </button>
  )
}

/**
 * Denetim Merkezi'nin içi: (gerekince "Toplantıya katıl") + kutucuk ızgarası · bir kutucuğun
 * ayrıntısı · düzenleme. Pencere ya da çekmece kapanınca içi söküldüğünden her açılış ızgarayla
 * başlar. Ayrıntıdan dönünce odak onu açan kutucuğa döner. Telefonda çentik kutucuğu çizilmez
 * (çentik orada header'ın altında şerit; düzenlemede görünür, çıkarılabilir).
 */
export function ControlPanel({ mobile }) {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const saved = useControlTiles()
  const look = useControlLook()
  const [view, setView] = useState("grid")
  const [from, setFrom] = useState(null)

  const open = (id) => {
    setFrom(id)
    setView(id)
  }
  const detail = view !== "grid" && view !== "edit"
  const kind = detail ? (isBuiltin(view) ? "options" : "detail") : view
  const motionProps = {
    initial: { opacity: 0, scale: reduce ? 1 : 0.985 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: EASE } },
    exit: { opacity: 0, scale: reduce ? 1 : 0.985, transition: { duration: 0.09, ease: "easeIn" } },
  }

  return (
    <TrayAccess>
      {(available) => {
        const tiles = visibleTiles(saved, available)
        const shown = mobile ? tiles.filter((id) => id !== "toggle:notch") : tiles
        return (
          <div
            className="cc-panel"
            data-view={kind}
            data-detail={detail ? view : undefined}
            data-mobile={mobile ? "" : undefined}
            data-look={look ?? undefined}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} {...motionProps}>
                {view === "grid" && (
                  <>
                    <MeetingJoin />
                    <OofPrompt />
                    <ControlGrid tiles={shown} all={tiles} onOpen={open} focusTile={from} />
                    <div className="cc-foot">
                      <EditPill
                        label={t("control.panel.edit")}
                        focusOnMount={from === "edit"}
                        onClick={() => {
                          setFrom("edit")
                          setView("edit")
                        }}
                      />
                    </div>
                  </>
                )}
                {view === "edit" && (
                  <ControlEdit tiles={tiles} available={available} onDone={() => setView("grid")} />
                )}
                {detail && <ControlDetail id={view} onBack={() => setView("grid")} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )
      }}
    </TrayAccess>
  )
}
