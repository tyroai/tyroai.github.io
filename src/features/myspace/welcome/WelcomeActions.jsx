import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Invoice03Icon from "@hugeicons/core-free-icons/Invoice03Icon"
import MoneyReceive01Icon from "@hugeicons/core-free-icons/MoneyReceive01Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon"
import { useLocale } from "@/hooks/useLocale"
import "./welcomeActions.css"

// Self Servis'in üç talebi; Anasayfa'nın çipleriyle aynı adlar ve simgeler.
const REQUESTS = [
  { kind: "leave", label: "myspace.chip.leaveRequest", icon: Beach02Icon },
  { kind: "expense", label: "myspace.chip.expense", icon: Invoice03Icon },
  { kind: "advance", label: "myspace.chip.advance", icon: MoneyReceive01Icon },
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
 * kapsülü). Sohbet sol üstteki kürede; kapsülde iş başlatılır:
 * - "Yeni talep" (birincil, beyaz yuva): üstünde küçük seçim kartı — İzin talebi · Masraf girişi ·
 *   İş avansı; seçilen form Self Servis'te açılır. Dışarıya dokunmak ya da Esc yalnız kartı kapatır.
 * - "Toplantı" ↔ "Katıl": çevrim içi toplantı 15 dakika içinde başlıyor ya da sürüyorsa "Katıl"
 *   (Teams; bağlantı, ortak `JoinButton` gibi), yoksa yeni toplantı penceresi.
 * Açamadığı sayfanın düğmesi çizilmez. Çekmeceyle birlikte kalkar, açıklık azalınca solar.
 */
export function WelcomeActions({ opacity, onRequest, joinUrl, onJoin, onMeeting }) {
  const { t } = useLocale()
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
            aria-label={t("insight.welcome.newRequest")}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={MENU}
          >
            {REQUESTS.map((r, i) => (
              <button
                key={r.kind}
                ref={i === 0 ? first : undefined}
                type="button"
                role="menuitem"
                className="welcome-menu-item"
                onClick={() => onRequest(r.kind)}
              >
                <span className="welcome-menu-ic" aria-hidden="true">
                  <HugeiconsIcon icon={r.icon} strokeWidth={1.9} />
                </span>
                {t(r.label)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {onRequest && (
        <button
          type="button"
          className="welcome-action"
          data-tone="primary"
          aria-haspopup="menu"
          aria-expanded={menu}
          onClick={() => setMenu((open) => !open)}
        >
          <Face icon={PlusSignIcon}>{t("insight.welcome.newRequest")}</Face>
        </button>
      )}
      {joinUrl ? (
        <a
          className="welcome-action"
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onJoin}
        >
          <Face icon={Video01Icon}>{t("calendar.join")}</Face>
        </a>
      ) : (
        onMeeting && (
          <button type="button" className="welcome-action" onClick={onMeeting}>
            <Face icon={CalendarAdd01Icon}>{t("calendar.page.new.meeting")}</Face>
          </button>
        )
      )}
    </motion.div>
  )
}
