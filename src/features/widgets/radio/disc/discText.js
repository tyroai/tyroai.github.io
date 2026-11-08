/** Diskin üst satırı: tür ve yer ("Pop · İstanbul"); ikisi de yoksa Tyrofy. Kart ve kutucuk ortak. */
export function metaOf(station, t, lang) {
  const tag = station.tags?.[0]
  const kind = tag ? tag.charAt(0).toLocaleUpperCase(lang) + tag.slice(1) : ""
  const where = station.near ? t("widgets.radio.near") : station.state
  return [kind, where].filter(Boolean).join(" · ") || t("widgets.radio.title")
}
