import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { DEFAULT_PALETTE, getPalette, knownPaletteId, palettes } from "@/data/palettes"
import { isPublicPage, LOGIN_PATH } from "@/lib/publicPages"
import { PALETTE_KEY, readAiPalette, saveChoice } from "@/lib/paletteStorage"
import { WORD_CORPORATE } from "@/lib/wordColor"
import { isRmPath } from "@/lib/rm/paths"

// tyroRM kendi paletini tutar (varsayılanı Midnight): orada seçilen palet tyroAI'nınkine dokunmaz.
const RM_STORAGE_KEY = "tyro-rm-palette"
export const RM_DEFAULT_PALETTE = "midnight"

/**
 * The login page always wears the app's default palette (Insta),
 * whatever palette the user picked inside the app.
 *
 * It is the one screen that isn't theirs yet — the front door of the product,
 * where the brand has to look the same for everyone, including the person
 * seeing it for the first time. Pinned here, at the single place that writes
 * `data-palette`, rather than in LoginPage: the page's colours come from CSS
 * tokens that dozens of components read (down to the orb's --voiceorb-*), so
 * pinning it component by component would leave pieces behind — and it did,
 * before this: the logo and its gradient were hardcoded literals while the
 * orb still followed whatever the user had chosen.
 *
 * The user's own selection is NOT touched: it stays in state and in
 * localStorage, and comes straight back the moment they leave /login.
 */
export const LOGIN_PALETTE = DEFAULT_PALETTE

const VALID = new Set(palettes.map((p) => p.id))

// "tyro" yazısının rengi (Profil › Görünüm): kurumsal ya da bir paletin renkleri. Uygulama ve
// tyroRM ortak; giriş ve tanıtım sayfaları kurumsal kalır.
const WORD_STORAGE_KEY = "tyro-word-color"

export const PaletteContext = createContext(null)

function readSaved(key, fallback) {
  if (typeof window === "undefined") return fallback
  return knownPaletteId(window.localStorage.getItem(key)) ?? fallback
}

export function PaletteProvider({ children }) {
  const [aiPalette, setAiPalette] = useState(() =>
    typeof window === "undefined" ? DEFAULT_PALETTE : readAiPalette(window.localStorage),
  )
  const [rmPalette, setRmPalette] = useState(() => readSaved(RM_STORAGE_KEY, RM_DEFAULT_PALETTE))
  const [savedWordColor, setSavedWordColor] = useState(() =>
    readSaved(WORD_STORAGE_KEY, WORD_CORPORATE),
  )
  const { pathname } = useLocation()
  const inRm = isRmPath(pathname)
  // Görünen palet bulunulan uygulamanınki; seçici de onu gösterir ve onu değiştirir.
  const palette = inRm ? rmPalette : aiPalette
  // Tanıtım sayfaları (Hakkımızda · Ekibimiz) girişin uzantısı: aynı çivili palet.
  const pinned = pathname === LOGIN_PATH || isPublicPage(pathname) ? LOGIN_PALETTE : null

  useEffect(() => {
    const id = pinned ?? palette
    document.documentElement.setAttribute("data-palette", id)
    // Paletin türü (düz · degrade): degrade paletlerde bazı yüzeyler (Anasayfa'nın CANLI rozeti)
    // rampayı gösterir; düz palette tek renk kalır.
    document.documentElement.setAttribute("data-palette-group", getPalette(id).group)
  }, [palette, pinned])

  // Yalnız kullanıcının seçimi yazılır (`lib/paletteStorage`): seçmemiş olan varsayılanı izler;
  // giriş sayfasının çivili paleti de hiç yazılmaz.
  const setPalette = useCallback(
    (id) => {
      if (inRm) {
        const next = VALID.has(id) ? id : RM_DEFAULT_PALETTE
        setRmPalette(next)
        saveChoice(window.localStorage, RM_STORAGE_KEY, next)
      } else {
        const next = VALID.has(id) ? id : DEFAULT_PALETTE
        setAiPalette(next)
        saveChoice(window.localStorage, PALETTE_KEY, next)
      }
    },
    [inRm],
  )
  const setWordColor = useCallback((id) => {
    const next = VALID.has(id) ? id : WORD_CORPORATE
    setSavedWordColor(next)
    saveChoice(window.localStorage, WORD_STORAGE_KEY, next)
  }, [])
  const wordColor = pinned ? WORD_CORPORATE : savedWordColor

  const value = useMemo(
    () => ({ palette, setPalette, palettes, wordColor, setWordColor }),
    [palette, setPalette, wordColor, setWordColor],
  )

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
}
