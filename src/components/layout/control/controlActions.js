import { createContext, useContext } from "react"

/**
 * Kutucukların panelin dışına uzanan eylemleri (Denetim Merkezi verir): pencereyi kapat, bir
 * sayfaya git (kapanarak), çentiği düzenle (pencere kapanır, seçici düğmenin altında açılır).
 */
export const ControlActions = createContext({
  close: () => {},
  go: () => {},
  openNotchEdit: () => {},
})

export const useControlActions = () => useContext(ControlActions)
