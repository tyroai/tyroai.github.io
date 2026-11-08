import { useState } from "react"

// Yazı alanında "?" yazılır, kısayol listesi açılmaz.
const typing = (el) =>
  el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || Boolean(el?.isContentEditable)

/**
 * Formun genel tuşları (pencerenin kendisinde dinlenir): "?" kısayol listesini açar (yazı
 * alanında değilse), Ctrl/⌘+Enter her formda gönderir (masraf ızgarası kendisi işler — işlenmiş
 * tuşa dokunulmaz). Dönüş: `help` (liste açık mı), `setHelp`, `onKeyDown`.
 */
export function useFormKeys(formRef) {
  const [help, setHelp] = useState(false)
  const onKeyDown = (e) => {
    if (e.defaultPrevented) return
    if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target)) {
      e.preventDefault()
      setHelp(true)
      return
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }
  return { help, setHelp, onKeyDown }
}
