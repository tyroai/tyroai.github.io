import { useMemo } from "react"
import { usePalette } from "@/hooks/usePalette"
import { useTheme } from "@/hooks/useTheme"
import { CATALOG } from "./layout"
import { baseLook, glassTint, lookPalette, paletteKind, paletteTokens } from "./paletteTokens"
import { inkOfColors, useBrandInk } from "./useBrandInk"
import "./lookTone.css"

/**
 * Görünümün tonu — kartın içi hangi temanın token'larıyla çizilir: "Koyu" açık temada da koyu
 * ada (`dark`), "Açık" koyu temada da açık ada (`look-light`; tema varyantı adanın içinde
 * `dark:` sınıflarını işletmez). "Renkli" paletin degradesi: mürekkep beyazsa koyu ada, koyuysa
 * (açık paletler) açık ada. Renkliyi kendisi çizen widget'lar (`ownPalette`: radyo, Karşılama)
 * tona girmez. Saf: testli.
 */
export function lookTone(id, look, ink) {
  const base = baseLook(look)
  if (base === "dark") return "dark"
  if (base === "light") return "light"
  if (base === "palette" && !CATALOG[id]?.ownPalette) return ink === "dark" ? "light" : "dark"
  return null
}

/**
 * Widget'ın kendi renginin hangi kipi kullanılır: Koyu (ya da koyu tonlu Renkli) paletin koyu
 * tema token'ları, Açık (ya da açık tonlu Renkli) açık tema token'ları; Standart, Cam ve
 * Renkli'yi kendisi çizen widget temayı izler. Saf: testli.
 */
export function lookMode(look, tone, theme) {
  const base = baseLook(look)
  if (base === "dark" || tone === "dark") return "dark"
  if (base === "light" || tone === "light") return "light"
  return theme === "dark" ? "dark" : "light"
}

// Renkli cam ve düz dolgu kuralları yalnız gerektiğinde iner: renk seçmeyenin ilk CSS'i büyümez.
let ownLook = null
const loadOwnLook = () =>
  (ownLook ??= import("./ownLook.css").catch(() => {
    ownLook = null
  }))

/**
 * Kart kabuğunun öznitelikleri (`data-widget-look`, ton sınıfı, palet) ve kartın mürekkebi.
 * Koyu ada paletin koyu temadaki mürekkebini de alsın diye `data-palette` taşır
 * (`.dark[data-palette=…]`). Renkli'de beyaz yazının altındaki gölgenin gücü `--look-veil`;
 * düz renk paletinde (`data-palette-kind="solid"`) Renkli düz dolgudur.
 * Widget kendi rengini seçtiyse (`<görünüm>:<palet>`) o paletin kartın kipindeki token'ları
 * kabuğa yazılır (camda renk payı `--look-tint`), mürekkep o paletten ölçülür ve döner (`ink`:
 * içerideki `useBrandInk` için, `CardInkContext`). Renk seçilmediyse uygulamanın paleti.
 */
export function useLookProps(id, look, className) {
  const global = useBrandInk()
  const { palette } = usePalette()
  const { theme } = useTheme()
  const base = baseLook(look)
  const own = lookPalette(look)
  const ownInk = useMemo(() => {
    const light = own ? paletteTokens(own) : null
    return light ? inkOfColors(light["--brand-from"], light["--brand-via"]) : null
  }, [own])
  const { ink, veil, light } = ownInk ?? global
  const tone = lookTone(id, base, ink)
  const mode = lookMode(base, tone, theme)
  // Renk seçilmediyse açık ada uygulamanın paletinin açık hâlini taşır: koyu temada kökteki koyu
  // mürekkep (ya da adanın derin tonu) açık paletlerde AA'nın altında kalıyordu.
  const source = own ?? (tone === "light" ? palette : null)
  const tokens = useMemo(
    () => (source ? paletteTokens(source, mode, { ink: base !== "palette" }) : null),
    [source, mode, base],
  )
  const style = {
    ...tokens,
    ...(base === "palette" ? { "--look-veil": veil } : {}),
    ...(base === "glass" && own ? { "--look-tint": glassTint(light) } : {}),
  }
  const solid = base === "palette" && paletteKind(own ?? palette) === "solid"
  if (own || solid) loadOwnLook()
  const props = {
    "data-widget-look": base,
    "data-widget-palette": own ?? undefined,
    "data-palette-kind": solid ? "solid" : undefined,
    "data-palette": own ?? (tone === "dark" ? palette : undefined),
    className: [className, tone === "dark" ? "dark" : tone === "light" ? "look-light" : ""]
      .filter(Boolean)
      .join(" "),
    style: Object.keys(style).length ? style : undefined,
  }
  return [props, ownInk]
}
