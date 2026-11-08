import { useEffect } from "react"

/** `/` arama kutusuna atlar (HelpPage'in dinleyicisi: yazı alanında ve değiştiricide karışmaz). */
export function useSlashFocus(inputRef) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target
      const tag = el?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ block: "nearest" })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [inputRef])
}
