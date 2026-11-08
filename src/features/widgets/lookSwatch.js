import { getPalette } from "@/data/palettes"
import {
  baseLook,
  glassTint,
  hexLuminance,
  lookPalette,
  paletteKind,
  paletteTokens,
} from "./paletteTokens"

// Seçeneğin küçük örneği: menüde adın yanında görünümün kendisi (header'ın düzenleme
// panelinde de seçili görünümün düğmesi).
export const SWATCH = {
  // Standart temayı izler: yarısı açık, yarısı koyu (iOS'un "otomatik" simgesi gibi).
  standard: "ring-1 ring-border bg-[linear-gradient(135deg,#fff_50%,#1f1f22_50%)]",
  glass:
    "ring-1 ring-white/80 shadow-inner bg-[linear-gradient(140deg,rgb(255_255_255/0.85),rgb(255_255_255/0.3)),linear-gradient(135deg,var(--brand-from),var(--brand-to))]",
  palette: "bg-gradient-to-br from-brand-from via-brand-via to-brand-to",
  plain:
    "bg-card ring-1 ring-border [background-image:radial-gradient(circle_at_68%_32%,var(--brand-via)_0_24%,transparent_27%)]",
  light: "bg-white ring-1 ring-black/15",
  dark: "bg-[#1f1f22] ring-1 ring-white/15",
}

/** Paletin dairesi (renk seçici): degrade paletin kaşe renkleri çapraz, düz palet tek renk. */
export function paletteSwatch(id) {
  const p = getPalette(id)
  return p.group === "solid"
    ? { backgroundColor: p.swatch[0] }
    : { backgroundImage: `linear-gradient(135deg, ${p.swatch.join(", ")})` }
}

// Örneğin noktası kartın gerçek vurgusu: paletin o kipteki mürekkebi (Koyu'da koyu tema
// mürekkebi — Black'te beyaz); okunamazsa kaşenin orta rengi.
const inkOf = (id, mode) => paletteTokens(id, mode)?.["--brand-text"] ?? getPalette(id).swatch[1]
const dotOf = (color) => `radial-gradient(circle at 68% 32%, ${color} 0 24%, transparent 27%)`

/**
 * Renkli kartın düz dolgusu (`lookTone.css` ile aynı): paletin koyu temadaki beyaz yazılı ana rengi,
 * bir ton koyu; düz renk paletinde koyu dolgusu. Okunamazsa `null`.
 */
export function renkliFill(id) {
  const dark = paletteTokens(id, "dark")
  const pick = (k) => {
    const v = dark?.[k]
    return v && !v.startsWith("var(") ? v : null
  }
  if (paletteKind(id) === "solid") return pick("--brand-fill-deep") ?? pick("--brand-deep")
  const solid = pick("--brand-solid")
  return solid ? `color-mix(in oklab, ${solid}, black 12%)` : null
}

/**
 * Görünüm seçeneğinin örneği, widget'ın kendi rengiyle — kartın gerçekte nasıl görüneceği:
 * Renkli düz dolgu (`renkliFill`), Cam kartın renk payıyla (`glassTint`: koyu paletlerde soluk)
 * buz, Standart · Açık · Koyu zeminde paletin o kipteki vurgusu. Renk yoksa uygulamanın paletiyle
 * (`app`; Renkli dışında `SWATCH`).
 */
export function lookSwatch(base, id, app) {
  if (base === "palette") {
    const fill = renkliFill(id ?? app)
    return fill
      ? { className: "ring-1 ring-black/10", style: { backgroundColor: fill } }
      : { className: SWATCH.palette }
  }
  if (!id) return { className: SWATCH[base] }
  if (base === "glass") {
    const [from, via, to] = getPalette(id).swatch
    const tint = glassTint((hexLuminance(from) + hexLuminance(via)) / 2)
    const mix = (c, k) => `color-mix(in oklab, ${c} ${Math.round(tint * k * 100)}%, white)`
    return {
      className: "ring-1 ring-black/10 shadow-inner",
      style: {
        backgroundImage: `linear-gradient(140deg, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.05)), linear-gradient(135deg, ${mix(from, 1)}, ${mix(via, 0.8)}, ${mix(to, 1.1)})`,
      },
    }
  }
  if (base === "dark")
    return {
      className: "ring-1 ring-white/15",
      style: { backgroundColor: "#1f1f22", backgroundImage: dotOf(inkOf(id, "dark")) },
    }
  if (base === "light")
    return {
      className: "ring-1 ring-black/15",
      style: { backgroundColor: "#fff", backgroundImage: dotOf(inkOf(id, "light")) },
    }
  if (base === "plain")
    return {
      className: "bg-card ring-1 ring-border",
      style: { backgroundImage: dotOf(inkOf(id, "light")) },
    }
  return {
    className: "ring-1 ring-border",
    style: {
      backgroundImage: `${dotOf(inkOf(id, "light"))}, linear-gradient(135deg, #fff 50%, #1f1f22 50%)`,
    },
  }
}

/** Rengin adı: paletin adı ya da "Uygulamanın paleti". */
export const colorName = (t, id) => (id ? t(getPalette(id).labelKey) : t("widgets.look.appPalette"))

/** Görünümün tam adı (erişilebilir ad): "Cam · Green Garden" ya da yalnız "Cam". */
export function lookName(t, look) {
  const base = t(`widgets.look.${baseLook(look)}`)
  const own = lookPalette(look)
  return own ? `${base} · ${colorName(t, own)}` : base
}

/** Seçim duyurusu: görünüm değiştiyse görünüm, yalnız renk değiştiyse renk söylenir. */
export function lookNotice(t, name, prev, next) {
  return baseLook(prev) === baseLook(next)
    ? t("widgets.say.color", { name, color: colorName(t, lookPalette(next)) })
    : t("widgets.say.look", { name, look: t(`widgets.look.${baseLook(next)}`) })
}
