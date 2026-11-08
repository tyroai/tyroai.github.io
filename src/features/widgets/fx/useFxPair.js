import { useCallback, useEffect, useState } from "react"

const KEY = "tyro-fx-v1"

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    return v?.v === 1
      ? { from: v.from, to: v.to, text: typeof v.text === "string" ? v.text : "" }
      : null
  } catch {
    return null
  }
}

/**
 * Çeviricinin son çifti ve tutarı bu tarayıcıda (`tyro-fx-v1`; tercih, kişisel veri değil): kart,
 * header penceresi ve Denetim Merkezi aynı çifti gösterir. Çift doğrulaması çağıranda
 * (`sanitizePair`: seçenekler piyasa verisi gelince belli olur).
 */
export function useFxPair() {
  const [state, setState] = useState(() => read() ?? { from: null, to: null, text: "100" })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, ...state }))
    } catch {
      // Depo kapalı: çift bu oturumda kalır.
    }
  }, [state])

  const setFrom = useCallback((from) => setState((s) => ({ ...s, from })), [])
  const setTo = useCallback((to) => setState((s) => ({ ...s, to })), [])
  const setText = useCallback((text) => setState((s) => ({ ...s, text })), [])
  const swap = useCallback((pair) => setState((s) => ({ ...s, from: pair.to, to: pair.from })), [])

  return { saved: state, setFrom, setTo, setText, swap }
}
