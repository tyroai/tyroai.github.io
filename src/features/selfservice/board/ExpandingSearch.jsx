import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { SearchField } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { GHOST, ICON } from "../chips"
import "./boardToolbar.css"

/** Odak bir yazı alanındayken "/" yazıdır, kısayol değil. */
const typing = (el) =>
  el instanceof Element &&
  Boolean(el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']"))

/**
 * Self Servis sekmelerinin araması: kapalıyken yalnız büyüteç (araç çubuğu sade kalır); basınca
 * ya da "/" ile genişler ve imleç kutuya geçer. Boşken dışarı çıkınca ya da Escape'te yeniden
 * simge olur (odak simgeye döner); içinde arama varken açık kalır. Kutu `SearchField` —
 * uygulamanın tek arama kutusu; `className` açıkken kutunun eni.
 */
export function ExpandingSearch({
  value,
  onChange,
  placeholder,
  label,
  shortcut = false,
  className,
}) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const input = useRef(null)
  const button = useRef(null)
  const expanded = open || Boolean(value)

  // Açılınca imleç kutuya (kutu bu çizimde doğdu).
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  // Kapalıyken "/" da açar (açıkken kısayolu kutunun kendisi dinler).
  useEffect(() => {
    if (!shortcut || expanded) return undefined
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
      if (!button.current || button.current.offsetParent === null) return
      if (document.querySelector("[role=dialog]")) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcut, expanded])

  // Boşken kutunun dışına basılınca da kapanır (odak olayı gelmese bile: pencere arkadayken).
  const box = useRef(null)
  const empty = !value
  useEffect(() => {
    if (!open || !empty) return undefined
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open, empty])

  const collapse = (refocus) => {
    setOpen(false)
    if (refocus) requestAnimationFrame(() => button.current?.focus())
  }

  if (!expanded) {
    return (
      <button
        ref={button}
        type="button"
        aria-label={label ?? placeholder}
        aria-expanded={false}
        aria-keyshortcuts={shortcut ? "/" : undefined}
        title={shortcut ? t("toolbar.searchShortcut") : (label ?? placeholder)}
        onClick={() => setOpen(true)}
        className={cn(GHOST, ICON, "rounded-full")}
      >
        <HugeiconsIcon icon={Search01Icon} aria-hidden="true" strokeWidth={1.9} />
      </button>
    )
  }
  return (
    <div
      ref={box}
      className={cn("ss-search-open min-w-0", className)}
      onBlur={(e) => {
        // Odak kutunun dışına çıktı ve arama boş: simgeye dön.
        if (!value && !e.currentTarget.contains(e.relatedTarget)) collapse(false)
      }}
      onKeyDown={(e) => {
        // Dolu kutuda Escape kutunun kendisinde temizler; boşken kapatır.
        if (e.key === "Escape" && !value) {
          e.stopPropagation()
          collapse(true)
        }
      }}
    >
      <SearchField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        label={label}
        shortcut={shortcut}
        inputRef={input}
      />
    </div>
  )
}
