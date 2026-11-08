import { useEffect, useState } from "react"
import { markWelcomeSeen, welcomeDue } from "./welcomeSeen"

/**
 * Karşılama çekmecesi açık mı: telefonda, her açılışın ve yenilemenin ilk Anasayfa ziyaretinde
 * (`welcomeDue`); tur adresle istendiyse açılmaz. DEV'de `?welcome=1` her ekranda açar (görsel
 * denemeler). Açıldığı an görülmüş sayılır: uygulama içinde Anasayfa'ya dönünce yeniden inmez.
 */
export function useWelcome(params) {
  const [open, setOpen] = useState(() => {
    if (params.get("tour")) return false
    return welcomeDue() || (import.meta.env.DEV && params.get("welcome") === "1")
  })
  useEffect(() => {
    if (open) markWelcomeSeen()
  }, [open])
  return { open, close: () => setOpen(false) }
}
