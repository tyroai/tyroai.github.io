import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { palettes } from "@/data/palettes"
import { useLocale } from "@/hooks/useLocale"
import { usePalette } from "@/hooks/usePalette"
import { cn } from "@/lib/utils"
import { lookSwatch, paletteSwatch } from "./lookSwatch"
import { baseLook, lookPalette, withBase, withPalette } from "./paletteTokens"
import "./lookMenu.css"

// Seçim menüyü kapatmaz: görünüm ve renk aynı turda ayarlanır, kart arkada hemen değişir.
const keepOpen = (e) => e.preventDefault()

/**
 * Görünüm menüsünün içi (şerit, kart tutamağı, header): iki bağımsız seçim. Görünüm (Standart ·
 * Açık · Koyu · Cam · Renkli) yan yana küçük önizleme karoları: kartın o görünümdeki hâli, altında
 * adı; seçili olanın çevresinde palet halkası. Altında Renk: macOS'un vurgu rengi seçicisi gibi
 * daireler — ilki "Uygulamanın paleti" (renk seçilmemiş: bugünkü sistem), sonra degrade paletler,
 * sonra düz renkler; seçili rengin adı altta yazar. Görünüm değişince renk, renk değişince görünüm korunur; örnekler
 * seçili renkle çizilir. Zaten seçili olana basmak bir şey değiştirmez (duyuru da yok).
 */
export function LookChoices({ looks, look, onLook }) {
  const { t } = useLocale()
  const { palette } = usePalette()
  const base = baseLook(look)
  const own = lookPalette(look)
  const pickColor = (id) => id !== own && onLook(withPalette(look, id))
  return (
    <>
      <DropdownMenuLabel>{t("widgets.look.title")}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={base}
        onValueChange={(value) => value !== base && onLook(withBase(look, value))}
        className="lk-looks"
      >
        {looks.map((value) => {
          const swatch = lookSwatch(value, own, palette)
          return (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              onSelect={keepOpen}
              className="lk-look"
            >
              <span
                aria-hidden="true"
                className={cn("lk-look-prev", swatch.className)}
                style={swatch.style}
              />
              <span className="lk-look-name">{t(`widgets.look.${value}`)}</span>
            </DropdownMenuRadioItem>
          )
        })}
      </DropdownMenuRadioGroup>
      <DropdownMenuLabel>{t("widgets.look.paletteTitle")}</DropdownMenuLabel>
      <div role="group" aria-label={t("widgets.look.paletteTitle")}>
        <div className="lk-colors">
          <Dot
            app
            selected={!own}
            label={t("widgets.look.appPalette")}
            onSelect={(e) => {
              keepOpen(e)
              pickColor(null)
            }}
          />
          {palettes.map((p) => (
            <Dot
              key={p.id}
              selected={own === p.id}
              label={t(p.labelKey)}
              style={paletteSwatch(p.id)}
              onSelect={(e) => {
                keepOpen(e)
                pickColor(p.id)
              }}
            />
          ))}
        </div>
        {/* Hangi rengin seçili olduğu yazıyla da: daire yalnız renk. */}
        <p className="lk-app-note" aria-hidden="true">
          {own
            ? t(palettes.find((p) => p.id === own)?.labelKey ?? "widgets.look.appPalette")
            : t("widgets.look.appPalette")}
        </p>
      </div>
    </>
  )
}

function Dot({ selected, label, style, onSelect, app = false }) {
  return (
    <DropdownMenuItem
      role="menuitemradio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      // Daire yalnız renk: klavyede adıyla aranabilsin (Radix'in harfle gezinmesi).
      textValue={label}
      onSelect={onSelect}
      style={style}
      data-app={app ? "" : undefined}
      className="lk-dot"
    >
      {selected && <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} aria-hidden="true" />}
    </DropdownMenuItem>
  )
}
