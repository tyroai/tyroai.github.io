import { lazy, Suspense, useEffect, useState } from "react"
import { useWeather } from "@/hooks/useWeather"
import { onWeatherDetail } from "@/lib/weatherDetailBus"

const WeatherDialog = lazy(() =>
  import("./WeatherDialog").then((m) => ({ default: m.WeatherDialog })),
)

/**
 * Hava ayrıntı penceresinin uygulamadaki tek evi — Denetim Merkezi'nin hava kutucuğu ve Master kart
 * buradan açar (`lib/weatherDetailBus`). Pencere Anasayfa'daki hava kartının açtığıyla aynı
 * (`WeatherDialog`: saatlik şerit, günler, ayrıntılar). Hava verisi ortak önbellekten (`useWeather`,
 * ek istek yok). İlk istekte iner.
 */
export function WeatherDetailHost() {
  const [open, setOpen] = useState(false)
  const [used, setUsed] = useState(false)
  const w = useWeather()

  useEffect(
    () =>
      onWeatherDetail(() => {
        setUsed(true)
        setOpen(true)
      }),
    [],
  )

  if (!used || w.status !== "ready") return null
  return (
    <Suspense fallback={null}>
      <WeatherDialog open={open} onOpenChange={setOpen} w={w} returnFocusRef={null} />
    </Suspense>
  )
}
