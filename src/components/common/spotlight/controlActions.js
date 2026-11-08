import { requestControl } from "@/components/layout/control/controlIntent"
import { edgeNotchScope, readEdgeNotchOpen, writeEdgeNotchOpen } from "@/lib/edgeNotchState"
import { FOCUS_DEFAULT, focusModeOn, setFocusMode } from "@/lib/focusMode"
import { presentModeOn, setPresentMode } from "@/lib/presentMode"

/**
 * Aramanın Denetim Merkezi komutları (Spotlight bağlar): pencereyi aç, Odak / Sunum modunu ve
 * çentiği aç-kapa, Anasayfa'yı düzenle. Arama kapandıktan sonra çalışır (`requestAnimationFrame`):
 * kapanan pencere odağı geri verirken açılan Denetim Merkezi'ni kapatmasın. İşlediyse `true`.
 */
export function runControlAction(id, { go }) {
  const later = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn))
  if (id === "control") later(() => requestControl("open"))
  else if (id === "focus") setFocusMode(focusModeOn() ? null : FOCUS_DEFAULT)
  else if (id === "present") setPresentMode(!presentModeOn())
  else if (id === "notch") {
    const scope = edgeNotchScope(window.location.pathname.split("/")[1] || "myspace")
    writeEdgeNotchOpen(!readEdgeNotchOpen(scope), scope)
  } else if (id === "home-edit") go("/myspace?edit=1")
  else return false
  return true
}
