import CloudAngledZapIcon from "@hugeicons/core-free-icons/CloudAngledZapIcon"
import CloudFastWindIcon from "@hugeicons/core-free-icons/CloudFastWindIcon"
import FastWindIcon from "@hugeicons/core-free-icons/FastWindIcon"
import SnowIcon from "@hugeicons/core-free-icons/SnowIcon"
import ThermometerColdIcon from "@hugeicons/core-free-icons/ThermometerColdIcon"
import ThermometerWarmIcon from "@hugeicons/core-free-icons/ThermometerWarmIcon"
import UmbrellaIcon from "@hugeicons/core-free-icons/UmbrellaIcon"
import { splitMarks } from "../dayInsightText"

const COLD = ThermometerColdIcon
const precip = (what) => (what === "snow" ? SnowIcon : UmbrellaIcon)

/**
 * Havanın okumasından (`lib/weatherInsight`) karşılamanın arkadaşça notu — yalnız dikkat isteyen
 * havada: yağmur/kar (ne zaman, diniyor mu, saatlerce mi), fırtına, rüzgâr, ayaz, sıcak, soğuk,
 * soğuma, sis. "15:00 sularında yağmur var, şemsiyeni unutma." gibi; simge havanın kendisi (şemsiye,
 * kar, şimşek, termometre…). Açık ve kuru havada not yok (söylenecek bir şey yok). Metinler
 * `insight.note.wx.*` (dört dil).
 */
export function weatherNote(w, { t, time, f }) {
  if (!w) return null
  const at = w.at ? time.format(w.at) : ""
  const note = (key, icon, params = {}) => ({
    id: "weather",
    icon,
    parts: splitMarks(t(`insight.note.wx.${key}`, { time: at, ...params })),
  })
  switch (w.id) {
    case "thunder":
      return note(w.now ? "thunder.now" : "thunder.soon", CloudAngledZapIcon)
    case "soon":
    case "until":
    case "long":
      return note(`${w.id}.${w.what === "snow" ? "snow" : "rain"}`, precip(w.what))
    case "wind":
      return note("wind", FastWindIcon)
    case "freeze":
      return note("freeze", COLD, { temp: f.temp(w.temp) })
    case "heat":
      return note("heat", ThermometerWarmIcon, { temp: f.temp(w.temp) })
    case "cold":
      return note("cold", COLD, { temp: f.temp(w.temp) })
    case "drop":
      return note("drop", COLD, { n: f.num(w.by) })
    case "fog":
      return note("fog", CloudFastWindIcon)
    default:
      return null
  }
}
