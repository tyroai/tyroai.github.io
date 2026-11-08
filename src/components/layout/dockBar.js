import { createContext, useContext } from "react"

/**
 * Sohbet panelinin pencere düğmeleri (genişlik · tam sayfa · kapat). Panel kendi başlık satırını
 * çizmez, düğmeleri sohbetin TEK araç çubuğuna verir: "TYRO Sohbet" ile ajanın adı üst üste iki
 * başlık oluyordu. Panel kapalıyken ve sohbet sayfasındayken `null`.
 * `{ wide, canWiden, onWiden, onExpand, onClose }`
 */
export const DockBarContext = createContext(null)

export const useDockBar = () => useContext(DockBarContext)
