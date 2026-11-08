import { useState } from "react"

/** En yakın kayan ata (telefonun çekmece gövdesi). */
function scroller(el) {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if ((y === "auto" || y === "scroll") && n.scrollHeight > n.clientHeight) return n
  }
  return null
}

/**
 * Telefonda izin ve avans iki adım: önce girişler (izinde tür ve tarihler, avansta alanlar), sonra
 * özet (etki kartı, avans özeti) ve gönder — form tek ekrana sığmıyordu. Masrafın kendi gözden
 * geçirmesi var, adımlı değil. Adım değişince gövde başa kayar. Dönüş: `stepped`, `step`
 * ("form" · "summary"), `first` (ilk adımda mı), `next`, `back`.
 */
export function usePhoneSteps({ kind, mobile, bodyRef }) {
  const stepped = mobile && (kind === "leave" || kind === "advance")
  const [step, setStep] = useState("form")
  const go = (to) => {
    setStep(to)
    requestAnimationFrame(() => scroller(bodyRef.current)?.scrollTo({ top: 0 }))
  }
  return {
    stepped,
    step: stepped ? step : null,
    first: stepped && step === "form",
    next: () => go("summary"),
    back: () => go("form"),
  }
}
