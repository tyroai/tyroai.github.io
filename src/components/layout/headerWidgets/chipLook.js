import { useMemo } from "react"
import { baseLook, lookPalette, paletteTokens } from "@/features/widgets/paletteTokens"
import { inkOfColors, useBrandInk } from "@/features/widgets/useBrandInk"
import { useTheme } from "@/hooks/useTheme"

/**
 * Tepsideki kapsülün görünümü — widget'ın header'daki görünüm seçimi kapsüle de geçer: Açık,
 * Koyu, Cam, Renkli (Standart: çıplak ikon, bugünkü gibi). Widget kendi rengini seçtiyse
 * (`glass:green-garden`) o paletin token'ları kapsüle yazılır (kartta olduğu gibi, `var(…)`
 * zincirleri kapsülde çözülsün diye tamamı); Renkli'de yazı paletin açıklığına göre beyaz ya da koyu.
 * Kurallar `trayLooks.css`te (tepsiyle tembel iner).
 */
export function useChipLook(look) {
  const global = useBrandInk()
  const { theme } = useTheme()
  const base = baseLook(look)
  const own = lookPalette(look)
  return useMemo(() => {
    if (!base || base === "standard" || base === "plain") return {}
    const tokens = own ? paletteTokens(own, theme === "dark" ? "dark" : "light") : null
    const ink =
      base === "palette"
        ? ((tokens && inkOfColors(tokens["--brand-from"], tokens["--brand-via"])) ?? global)
        : undefined
    return {
      "data-chip-look": base,
      "data-chip-ink": ink ?? undefined,
      "data-chip-own": own ? "" : undefined,
      style: tokens ?? undefined,
    }
  }, [base, own, theme, global])
}
