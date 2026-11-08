import { useEffect, useState } from "react"
import { cityForecast } from "@/features/widgets/lib/tripWeather"

/** Varış şehrinin günlük tahmini (`features/widgets/lib/tripWeather`); şehir yoksa ya da gelmediyse `null`. */
export function useTripForecast(city) {
  const [state, setState] = useState({ id: null, days: null })
  useEffect(() => {
    if (!city) return undefined
    let live = true
    cityForecast(city).then((days) => live && setState({ id: city.id, days }))
    return () => {
      live = false
    }
  }, [city])
  return city && state.id === city.id ? state.days : null
}
