import { useEffect, useMemo, useState } from "react"
import { regionById } from "@/data/growingRegions"
import {
  fetchRegionForecast,
  fetchRegionHistory,
  normalsOf,
  peekHistory,
  rainState,
  rainVsNormal,
  soilVsNormal,
  upcomingRain,
} from "@/features/widgets/lib/regionWeather"

const dayKeys = new Map()
/** Bölgenin bugünü ("YYYY-AA-GG") kendi saat diliminde. */
function todayIn(tz, now) {
  let f = dayKeys.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    dayKeys.set(tz, f)
  }
  return f.format(now)
}

/**
 * Seçilen bölgelerin yağışı, toprak nemi ve tahmini. Elde olan son okuma hemen (bu tarayıcıda),
 * bölge başına iki istek (POWER günde bir, MET saatte bir); biri okunamazsa öteki yine görünür.
 */
export function useRegionWeather(ids, now) {
  const key = ids.join(",")
  const [state, setState] = useState({})
  useEffect(() => {
    let live = true
    for (const id of key.split(",")) {
      const region = regionById(id)
      if (!region) continue
      Promise.all([fetchRegionHistory(region), fetchRegionForecast(region)]).then(
        ([history, forecast]) => {
          if (live) setState((s) => ({ ...s, [id]: { history, forecast, settled: true } }))
        },
      )
    }
    return () => {
      live = false
    }
  }, [key])
  return useMemo(
    () =>
      key.split(",").map((id) => {
        const region = regionById(id)
        const s = state[id]
        const history = s?.history ?? peekHistory(id)
        const normals = normalsOf(id)
        const rain = history ? rainVsNormal(history, normals) : null
        return {
          region,
          rain,
          state: rainState(rain),
          soil: history ? soilVsNormal(history, normals) : null,
          ahead: s?.forecast ? upcomingRain(s.forecast, todayIn(region.tz, now)) : null,
          loading: !s?.settled && !history,
          failed: Boolean(s?.settled && !history && !s.forecast),
        }
      }),
    [key, state, now],
  )
}
