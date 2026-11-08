import { useState } from "react"
import { cardSunlit } from "@/lib/weatherSky"

// Köşk arka planının varsayılanı havaya ve saate göre: gündüz güneşli ve parçalı bulutlu gökte açık;
// gün batımından sonra ve öbür havalarda kapalı — mesainin bittiği de anlaşılır (ürün sahibinin
// kararı). Göze basanın seçimi iki durum için ayrı ayrı bu tarayıcıda kalır: güzel gündüz ve
// öbürleri. Eski tek değerli kayıt ("on"/"off") okunmaz, yeni varsayılan geçerli.
const KEY = "tyro-weather-estate"

function readChoices() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}")
    return v && typeof v === "object" ? v : {}
  } catch {
    return {}
  }
}

/** Varsayılanı açık durum: gündüz ve gökte güneş var (açık ya da parçalı bulutlu). */
export function fairSky(kind, night) {
  return cardSunlit(kind) && !night
}

/** Köşk açık mı: o durum için kaydedilmiş seçim, yoksa varsayılan (`fair` ise açık). */
export function estateShown(choices, fair) {
  const saved = choices?.[fair ? "fair" : "other"]
  return typeof saved === "boolean" ? saved : true
}

/** Hava kartının köşk arka planı: `[on, toggle]`. `fair`: `fairSky` (gündüz, güneşli gök). */
export function useEstatePref(fair) {
  const [choices, setChoices] = useState(readChoices)
  const on = estateShown(choices, fair)
  const toggle = () => {
    const next = { ...choices, [fair ? "fair" : "other"]: !on }
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // Depo kapalı: seçim bu oturumda kalır.
    }
    setChoices(next)
  }
  return [on, toggle]
}
