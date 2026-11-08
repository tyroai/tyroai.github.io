import { useEffect } from "react"

const editable = (el) =>
  !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/**
 * `/` sayfa aramasına odaklar — yalnız odak bir yazı alanında değilse ve değiştirici tuş
 * yoksa (`useHotkey` koşulsuz `preventDefault` ettiği için kullanılmaz). Açık kutu/çekmece
 * varken (odak orada, `aria-modal`) dokunmaz.
 */
export function useSlashFocus(ref) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if (editable(document.activeElement)) return
      if (document.activeElement?.closest?.("[role=dialog]")) return
      if (!ref.current) return
      e.preventDefault()
      ref.current.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [ref])
}
