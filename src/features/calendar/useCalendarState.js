import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { readPrefs, writePrefs } from "@/features/calendar/lib/prefs"
import { rangeOf, shiftAnchor } from "@/features/calendar/lib/range"
import { readShowWeekend, writeShowWeekend } from "@/features/calendar/lib/weekend"
import { firstDayOfWeek } from "@/lib/weekStart"

const VIEW_KEYS = { d: "day", w: "week", m: "month" }

/** Klavye kısayolu yazı alanında ya da açık bir menü/pencerede çalışmaz. */
function typing(target) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='menu'], [role='dialog']",
    ),
  )
}

/**
 * Sayfanın durumu: görünüm, çapa gün, katmanlar, arama. Her girişte bugünün haftası (görünüm ve gün
 * hatırlanmaz); yalnız katmanlar bu tarayıcıda (`features/calendar/lib/prefs`). Telefonda görünüm hep hafta şeridi + ajanda
 * (`phone`), dar kapta hafta üç gündür (`cols`). Kısayollar: ← → önceki/sonraki dönem, T bugün,
 * D · W · M görünüm.
 */
export function useCalendarState({ phone, cols }) {
  const { locale } = useLocale()
  const today = useToday()
  const firstDay = firstDayOfWeek(locale)
  const [view, setView] = useState("week")
  const [layers, setLayers] = useState(() => readPrefs().layers)
  const [anchor, setAnchor] = useState(today)
  const [query, setQuery] = useState("")
  // Hafta sonu kutusu: yalnız kişinin açık seçimi yazılır (`lib/weekend`).
  const [showWeekend, setWeekend] = useState(readShowWeekend)
  const setShowWeekend = useCallback((on) => {
    setWeekend(on)
    writeShowWeekend(on)
  }, [])

  const shown = phone ? "week" : view
  const width = phone ? 7 : cols
  const range = useMemo(
    () => rangeOf(shown, anchor, firstDay, width),
    [shown, anchor, firstDay, width],
  )

  useEffect(() => {
    writePrefs({ layers })
  }, [layers])

  const step = useCallback(
    (dir) => setAnchor((a) => shiftAnchor(shown, a, dir, width)),
    [shown, width],
  )
  const goToday = useCallback(() => setAnchor(today), [today])
  const openDay = useCallback(
    (day) => {
      setAnchor(day)
      if (!phone) setView("day")
    },
    [phone],
  )
  const toggleLayer = useCallback(
    (kind) => setLayers((cur) => ({ ...cur, [kind]: cur[kind] === false })),
    [],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
      if (e.key === "ArrowLeft") step(-1)
      else if (e.key === "ArrowRight") step(1)
      else if (e.key.toLowerCase() === "t") goToday()
      else if (!phone && VIEW_KEYS[e.key.toLowerCase()]) setView(VIEW_KEYS[e.key.toLowerCase()])
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step, goToday, phone])

  return {
    today,
    firstDay,
    view: shown,
    pickedView: view,
    setView,
    anchor,
    setAnchor,
    range,
    layers,
    toggleLayer,
    query,
    setQuery,
    showWeekend,
    setShowWeekend,
    step,
    goToday,
    openDay,
  }
}
