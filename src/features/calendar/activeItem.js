import { createContext, useContext } from "react"

/**
 * Sağ panelde ayrıntısı açık öğenin kimliği: ızgaradaki bloğu ve çipi işaretlenir (ayrıntı artık
 * bloğa bağlı bir kart değil, sayfanın öbür ucunda). Izgaralara özellik olarak taşınmaz; okuyan
 * yalnız blok ve çip.
 */
export const ActiveItemContext = createContext(null)

export const useIsActive = (id) => useContext(ActiveItemContext) === id
