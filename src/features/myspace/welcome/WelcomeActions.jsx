import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Invoice03Icon from "@hugeicons/core-free-icons/Invoice03Icon"
import MoneyReceive01Icon from "@hugeicons/core-free-icons/MoneyReceive01Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import TaskAdd01Icon from "@hugeicons/core-free-icons/TaskAdd01Icon"
import { useLocale } from "@/hooks/useLocale"
import "./welcomeActions.css"

// "Yeni"nin seçenekleri: Self Servis'in üç talebi, görev ve toplantı (Takvim'de açılır). Kısa adlar.
const ITEMS = [
  { kind: "leave", label: "insight.welcome.menu.leave", icon: Beach02Icon, need: "selfService" },
  {
    kind: "expense",
    label: "insight.welcome.menu.expense",
    icon: Invoice03Icon,
    need: "selfService",
  },
  {
    kind: "advance",
    label: "insight.welcome.menu.advance",
    icon: MoneyReceive01Icon,
    need: "selfService",
  },
  { kind: "task", label: "insight.welcome.menu.task", icon: TaskAdd01Icon, need: "calendar" },
  {
    kind: "meeting",
    label: "insight.welcome.menu.meeting",
    icon: CalendarAdd01Icon,
    need: "calendar",
  },
]
// Seçim kartı düğmenin köşesinden yayla açılır, sekmez (kuvvet yok).
const MENU = { type: "spring", bounce: 0, duration: 0.26 }

function Face({ icon, children }) {
  return (
    <>
      <span className="welcome-action-ic" aria-hidden="true">
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </span>
      {children}
    </>
  )
}

/**
 * Çekmecenin alt kenarına yarı yarıya oturan koyu cam kapsül (referansın "Send · Receive"
 * kapsülü; ürün sahibi: "ilkine Yeni yazalım … sağdaki toplantı yerine de TYRO butonu koy"):
 * - "Yeni" (birincil, beyaz yuva): üstünde küçük seçim kartı — İzin · Masraf · Avans (Self Servis) ·
 *   Görev · Toplantı (Takvim); yalnız kişinin açabildiği sayfanınkiler. Dışarıya dokunmak ya da Esc
 *   yalnız kartı kapatır.
 * - "TYRO" (kenar çubuğundaki sohbet simgesiyle): sohbeti açar. Küre burada yok: TYRO'nun küresi
 *   hemen üstündeki öneri kartında (ürün sahibi: "butonda ise orbu koyma zaten öneride var").
 * Çekmeceyle birlikte kalkar, açıklık azalınca solar.
 */
export function WelcomeActions({ opacity, access, onNew, onAsk }) {
  const { t } = useLocale()
  const items = ITEMS.filter((it) => access?.[it.need])
  const [menu, setMenu] = useState(false)
  const box = useRef(null)
  const first = useRef(null)

  useEffect(() => {
    if (!menu) return undefined
    first.current?.focus({ preventScroll: true })
    const away = (e) => {
      if (!box.current?.contains(e.target)) setMenu(false)
    }
    document.addEventListener("pointerdown", away, true)
    return () => document.removeEventListener("pointerdown", away, true)
  }, [menu])

  // Açık kartta Esc yalnız kartı kapatır (çekmece açık kalır), odak düğmeye döner; oklar
  // seçenekler arasında dolaşır (menü kalıbı).
  const onKeyDown = (e) => {
    if (!menu) return
    if (e.key === "Escape") {
      e.stopPropagation()
      setMenu(false)
      box.current?.querySelector("[aria-haspopup]")?.focus()
      return
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    const items = [...(box.current?.querySelectorAll('[role="menuitem"]') ?? [])]
    if (!items.length) return
    e.preventDefault()
    const at = items.indexOf(document.activeElement)
    const step = e.key === "ArrowDown" ? 1 : -1
    items[(at + step + items.length) % items.length].focus()
  }

  return (
    <motion.div ref={box} className="welcome-actions" style={{ opacity }} onKeyDown={onKeyDown}>
      <AnimatePresence>
        {menu && (
          <motion.div
            className="welcome-menu"
            role="menu"
            aria-label={t("insight.welcome.new")}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={MENU}
          >
            {items.map((it, i) => (
              <button
                key={it.kind}
                ref={i === 0 ? first : undefined}
                type="button"
                role="menuitem"
                className="welcome-menu-item"
                onClick={() => onNew(it.kind)}
              >
                <span className="welcome-menu-ic" aria-hidden="true">
                  <HugeiconsIcon icon={it.icon} strokeWidth={1.9} />
                </span>
                {t(it.label)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {items.length > 0 && (
        <button
          type="button"
          className="welcome-action"
          data-tone="primary"
          aria-haspopup="menu"
          aria-expanded={menu}
          onClick={() => setMenu((open) => !open)}
        >
          <Face icon={PlusSignIcon}>{t("insight.welcome.new")}</Face>
        </button>
      )}
      <button
        type="button"
        className="welcome-action"
        aria-label={t("insight.welcome.ask")}
        onClick={onAsk}
      >
        <Face icon={AiChat02Icon}>TYRO</Face>
      </button>
    </motion.div>
  )
}
