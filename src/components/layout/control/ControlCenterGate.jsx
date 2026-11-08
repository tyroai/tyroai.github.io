import { lazy, Suspense, useEffect } from "react"
import { ControlButton } from "./ControlButton"
import { handoff, intentReady, markIntent, requestControl } from "./controlIntent"

// Kod ilk niyetten sonra iner; o ana kadar yer tutucu düğme (aynı görünüş) çizilir.
const ControlCenter = lazy(() => intentReady.then(() => import("./ControlCenter")))

function onFocus() {
  handoff.focused = true
  markIntent()
}

// Odak başka bir öğeye geçtiyse devredilmez; yer tutucu kaldırılırken gelen bulanıklıkta
// (`relatedTarget` yok) odak yeni düğmeye taşınır.
function onBlur(e) {
  if (e.relatedTarget) handoff.focused = false
}

function onClick() {
  handoff.open = true
  markIntent()
}

// ⌥⌘K (Windows'ta Ctrl+Alt+K): ⌘K aramanın yanında. Mac'te ⌥ harfi değiştirir: tuşun yerine bakılır.
const isHotkey = (e) => (e.metaKey || e.ctrlKey) && e.altKey && !e.shiftKey && e.code === "KeyK"

/**
 * Denetim Merkezi'nin header'daki kapısı (çanın solunda): düğme hemen çizilir, panelin kodu
 * ilk niyette ya da uygulama açıldıktan sonra boşta iner — ilk dokunuş beklemez, açılış paketine
 * girmez (`controlIntent`). Kısayol tuşu her zaman dinlenir.
 */
export function ControlCenterGate() {
  useEffect(() => {
    const onKey = (e) => {
      if (!isHotkey(e)) return
      e.preventDefault()
      requestControl("toggle")
    }
    window.addEventListener("keydown", onKey)
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(markIntent, { timeout: 5000 })
      : window.setTimeout(markIntent, 3000)
    return () => {
      window.removeEventListener("keydown", onKey)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [])
  return (
    <Suspense
      fallback={
        <ControlButton
          onPointerEnter={markIntent}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onClick}
        />
      }
    >
      <ControlCenter />
    </Suspense>
  )
}
