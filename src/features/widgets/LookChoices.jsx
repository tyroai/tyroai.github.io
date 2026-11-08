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
import { SWATCH, lookSwatch, paletteSwatch } from "./lookSwatch"
import { baseLook, lookPalette, withBase, withPalette } from "./paletteTokens"

// Seçim menüyü kapatmaz: görünüm ve renk aynı turda ayarlanır, kart arkada hemen değişir.
const keepOpen = (e) => e.preventDefault()

/**
 * Görünüm menüsünün içi (şerit, kart tutamağı, header): iki bağımsız seçim. Görünüm (Standart ·
 * Açık · Koyu · Cam · Renkli) radyo seçenekleri; altında Renk: önce "Uygulamanın paleti" satırı
 * (renk seçilmemiş: bugünkü sistem), sonra macOS'un vurgu rengi seçicisi gibi daireler — degrade
 * paletler, sonra düz renkler. Görünüm değişince renk, renk değişince görünüm korunur; örnekler
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
      >
        {looks.map((value) => {
          const swatch = lookSwatch(value, own, palette)
          return (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              onSelect={keepOpen}
              className="pointer-coarse:min-h-11"
            >
              <span
                aria-hidden="true"
                className={cn("size-4 shrink-0 rounded-[5px]", swatch.className)}
                style={swatch.style}
              />
              {t(`widgets.look.${value}`)}
            </DropdownMenuRadioItem>
          )
        })}
      </DropdownMenuRadioGroup>
      <DropdownMenuLabel className="pt-2 text-[0.6875rem] font-normal">
        {t("widgets.look.paletteTitle")}
      </DropdownMenuLabel>
      <div role="group" aria-label={t("widgets.look.paletteTitle")}>
        <DropdownMenuItem
          role="menuitemradio"
          aria-checked={!own}
          textValue={t("widgets.look.appPalette")}
          onSelect={(e) => {
            keepOpen(e)
            pickColor(null)
          }}
          className="relative pe-8 pointer-coarse:min-h-11"
        >
          <span
            aria-hidden="true"
            className={cn("size-4 shrink-0 rounded-full ring-1 ring-black/10", SWATCH.palette)}
          />
          {t("widgets.look.appPalette")}
          {!own && (
            <span className="pointer-events-none absolute right-2 flex items-center justify-center">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
            </span>
          )}
        </DropdownMenuItem>
        <div className="grid grid-cols-5 justify-items-center gap-1.5 px-2 pt-1 pb-2">
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
      </div>
    </>
  )
}

function Dot({ selected, label, style, onSelect }) {
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
      className={cn(
        "relative grid size-7 place-items-center rounded-full p-0 ring-1 ring-black/10 focus:ring-2 focus:ring-brand/60 data-[highlighted]:ring-2 pointer-coarse:size-10 pointer-coarse:after:absolute pointer-coarse:after:-inset-1",
        // Koyu menüde siyah daire zeminden ayrılsın (seçiliyken halka zaten ön planın renginde).
        selected
          ? "ring-2 ring-foreground ring-offset-2 ring-offset-popover"
          : "dark:ring-white/15",
      )}
    >
      {selected && (
        <HugeiconsIcon
          icon={Tick02Icon}
          className="size-3.5 text-white drop-shadow"
          strokeWidth={3}
          aria-hidden="true"
        />
      )}
    </DropdownMenuItem>
  )
}
