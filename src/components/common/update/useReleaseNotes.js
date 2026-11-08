import { useEffect, useState } from "react"

/**
 * Bekleyen yeni sürümün `version.json`'ı (sha, derleme zamanı, en yeni kayıtlar). Yalnız
 * kart açılacakken bir kez okunur; ön-önbellekte yok, sorgu dizesi HTTP önbelleğini atlatır.
 * `undefined`: henüz okunmadı (kart bekler) · `null`: okunamadı (kart genel metinle çıkar).
 */
export function useReleaseNotes(active) {
  const [release, setRelease] = useState(undefined)
  useEffect(() => {
    if (!active) return undefined
    let alive = true
    // Süre sınırı: kart bu cevabı bekliyor; takılan istek kartı hiç açtırmamalı.
    const signal = AbortSignal.timeout?.(8000)
    fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: "no-store", signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // Okunduğu an: kart derleme zamanını "bugün mü" diye buna göre yazar (render saf kalır).
        if (alive) setRelease(data ? { ...data, fetchedAt: Date.now() } : null)
      })
      .catch(() => {
        if (alive) setRelease(null)
      })
    return () => {
      alive = false
    }
  }, [active])
  return release
}
