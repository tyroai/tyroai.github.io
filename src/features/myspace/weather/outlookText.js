import SnowIcon from "@hugeicons/core-free-icons/SnowIcon"
import ThermometerColdIcon from "@hugeicons/core-free-icons/ThermometerColdIcon"
import UmbrellaIcon from "@hugeicons/core-free-icons/UmbrellaIcon"
import { dropPart } from "@/lib/weatherOutlook"

/** Satırın ikonu: şemsiye · kar tanesi · soğuyan termometre. */
export const outlookIcon = (o) =>
  o.type === "drop" ? ThermometerColdIcon : o.what === "snow" ? SnowIcon : UmbrellaIcon

/**
 * Yağmur satırının cümlesi (`lib/weatherOutlook`): "14:00 sularında yağmur bekleniyor, ~2 sa" ·
 * "Yağmur 16:00 sularında diniyor" · "Akşama doğru 7° düşüş". Saat "sularında": tahmin, radar
 * değil — ve Türkçede saate ek gelmez ("14:00'te" / "10:00'da" saate göre değişirdi).
 */
export function outlookText(o, { t, timeFmt, f }) {
  const time = o.at ? timeFmt.format(o.at) : ""
  if (o.type === "drop")
    return t(`myspace.weather.outlook.drop.${dropPart(o.at)}`, { n: f.num(o.by), time })
  if (o.type === "long") return t(`myspace.weather.outlook.long.${o.what}`)
  if (o.type === "until") return t(`myspace.weather.outlook.until.${o.what}`, { time })
  return t(`myspace.weather.outlook.${o.long ? "soonLong" : "soon"}.${o.what}`, {
    time,
    n: f.num(o.hours),
  })
}

/** Dar kartın kısa hâli: yağış başlıyorsa saati, sürüyorsa "şimdi", soğumada "−7°". */
export function outlookShort(o, { t, timeFmt, f }) {
  if (o.type === "drop") return `−${f.num(o.by)}°`
  if (o.type === "soon") return timeFmt.format(o.at)
  return t("myspace.weather.outlook.now")
}
