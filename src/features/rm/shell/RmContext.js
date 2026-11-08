import { createContext, useContext } from "react"

/** Bölümün ortak durumu: erişim, adres, veri, türetilmiş portföy, telefon düzeni. */
export const RmContext = createContext(null)

export function useRm() {
  const ctx = useContext(RmContext)
  if (!ctx) throw new Error("useRm: RmSection dışında")
  return ctx
}
