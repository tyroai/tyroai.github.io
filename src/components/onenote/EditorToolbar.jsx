import { Fragment, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon"
import ImageAdd02Icon from "@hugeicons/core-free-icons/ImageAdd02Icon"
import Heading01Icon from "@hugeicons/core-free-icons/Heading01Icon"
import Heading02Icon from "@hugeicons/core-free-icons/Heading02Icon"
import LeftToRightListBulletIcon from "@hugeicons/core-free-icons/LeftToRightListBulletIcon"
import LeftToRightListNumberIcon from "@hugeicons/core-free-icons/LeftToRightListNumberIcon"
import TextBoldIcon from "@hugeicons/core-free-icons/TextBoldIcon"
import TextItalicIcon from "@hugeicons/core-free-icons/TextItalicIcon"
import TextUnderlineIcon from "@hugeicons/core-free-icons/TextUnderlineIcon"
import { useLocale } from "@/hooks/useLocale"

const GROUPS = [
  [
    { key: "h1", icon: Heading01Icon },
    { key: "h2", icon: Heading02Icon },
  ],
  [
    { key: "bold", icon: TextBoldIcon, kbd: "B" },
    { key: "italic", icon: TextItalicIcon, kbd: "I" },
    { key: "underline", icon: TextUnderlineIcon, kbd: "U" },
  ],
  [
    { key: "ul", icon: LeftToRightListBulletIcon },
    { key: "ol", icon: LeftToRightListNumberIcon },
    { key: "todo", icon: CheckListIcon },
  ],
  [{ key: "image", icon: ImageAdd02Icon }],
]
const KEYS = GROUPS.flat().map((b) => b.key)

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")

function pressedOf(key, s) {
  if (key === "image") return undefined
  if (key === "h1" || key === "h2") return s.heading === key
  if (key === "ul" || key === "ol") return s.list === key
  return Boolean(s[key])
}

/**
 * Biçim çubuğu (Apple Notlar / Outlook kalıbı): başlık · satır içi biçim · liste ve yapılacak.
 * Düğmeler odağı yazıdan almaz (fare ile basınca imleç yerinde kalır); klavyede tek sekme durağı,
 * oklarla gezilir (`role="toolbar"`). Var olan maddede başlık ve liste düğmeleri kapalı. Resim
 * düğmesi `onRun("image")` ile dosya seçiciyi açar (düzenleyicide).
 */
export function EditorToolbar({ ref, state, onRun }) {
  const { t } = useLocale()
  const [focusKey, setFocusKey] = useState(KEYS[0])
  const buttons = useRef(new Map())
  const mod = isMac() ? "⌘" : "Ctrl+"
  const move = (e) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const dir = document.dir === "rtl" ? -step : step
    const next = KEYS[(KEYS.indexOf(focusKey) + dir + KEYS.length) % KEYS.length]
    setFocusKey(next)
    buttons.current.get(next)?.focus()
  }
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={t("onenote.edit.fmt.toolbar")}
      className="on-ed-bar"
      onKeyDown={move}
    >
      {GROUPS.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <span className="on-ed-bar-sep" aria-hidden="true" />}
          {group.map(({ key, icon, kbd }) => {
            const locked = state.lockBlock && key !== "todo" && key !== "image" && !kbd
            const label = t(`onenote.edit.fmt.${key}`)
            return (
              <button
                key={key}
                ref={(el) => {
                  if (el) buttons.current.set(key, el)
                  else buttons.current.delete(key)
                }}
                type="button"
                className="on-ed-btn"
                tabIndex={key === focusKey ? 0 : -1}
                // Resim hedefsiz de eklenir ("Not ekle"nin sonuna).
                disabled={(!state.where && key !== "image") || locked}
                aria-pressed={pressedOf(key, state)}
                aria-label={label}
                title={
                  locked ? t("onenote.edit.fmt.locked") : kbd ? `${label} (${mod}${kbd})` : label
                }
                // Fareyle basınca odak yazıda kalsın (seçim kaybolmasın).
                onMouseDown={(e) => e.preventDefault()}
                onFocus={() => setFocusKey(key)}
                onClick={() => onRun(key)}
              >
                <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
              </button>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}
