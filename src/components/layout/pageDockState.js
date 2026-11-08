import { createContext, useState } from "react"

/**
 * Sayfa panelinin durumu (bkz. `PageDock.jsx`): kenar kolonunun DOM düğümü (`target`) ve paneli o an
 * kullanan sayfa (`owner`: etiket + kapat). Kabuk sağlar, sayfalar `PageDockPortal` ile kullanır.
 */
export const PageDockContext = createContext(null)

export function usePageDockState() {
  const [target, setTarget] = useState(null)
  const [owner, setOwner] = useState(null)
  return { target, setTarget, owner, setOwner }
}
