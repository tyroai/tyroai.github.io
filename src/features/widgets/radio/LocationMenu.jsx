import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Gps01Icon from "@hugeicons/core-free-icons/Gps01Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OFFICE_CITIES } from "@/data/worldCities"
import { useLocale } from "@/hooks/useLocale"
import { bcp47 } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"

const ITEM = "min-h-9 text-[0.8125rem] pointer-coarse:min-h-11"
// Sohbet rıhtımı Escape dinliyor: menüyü kapatan Escape rıhtımı kapatmasın.
const stopEscape = (e) => e.stopPropagation()

// Ülke adları dile göre (`Intl.DisplayNames`), dil başına bir kez kurulur.
const regionNames = new Map()
function regionName(locale, cc) {
  if (!cc) return ""
  if (!regionNames.has(locale)) {
    try {
      // Kısa ad ("ABD", "US", "США"): menü dar, uzun ad şehri kırpıyordu.
      regionNames.set(
        locale,
        new Intl.DisplayNames([bcp47(locale)], { type: "region", style: "short" }),
      )
    } catch {
      regionNames.set(locale, null)
    }
  }
  return regionNames.get(locale)?.of(cc) ?? cc
}

/**
 * Başlıktaki yer hapı ("📍 İstanbul ▾"): bulunduğun yer (hava kartının yeri) ya da bir
 * TYRO ofisi. Yer IP'den tahminse "Tam konumumu kullan" — izin penceresi yalnız buna
 * basınca açılır. Kurum ağı (VPN) başka bir şehre çıkıyorsa ofis seçmek çaresi.
 */
export function LocationMenu({ place, value, onChange, tight = false }) {
  const { t, locale } = useLocale()
  const region = (cc) => regionName(locale, cc)
  const label = place.city || region(place.cc) || t("widgets.radio.place.auto")
  const auto = value === "auto" || !OFFICE_CITIES.some((c) => c.id === value)
  const selected = auto ? "auto" : value
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("widgets.radio.place.label", { place: label })}
          className={cn(
            // En az ikon + ok kadar daralır (ad kısalır); başlıktaki ad bundan sonra kısalır.
            "relative inline-flex h-7 min-w-[3.375rem] max-w-[9.5rem] shrink items-center justify-center gap-1 rounded-full pointer-coarse:after:absolute pointer-coarse:after:-inset-y-1 pointer-coarse:after:inset-x-0 bg-(--r-hover) px-2.5 text-[0.75rem] font-medium text-(--r-fg) backdrop-blur-sm transition hover:bg-(--r-active) hover:text-(--r-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--r-ring) data-[state=open]:bg-(--r-active) pointer-coarse:h-9",
            // `tight` (dar kartta başlıkta çevirici de var): yalnız ikon ve ok, sıkı pay.
            tight &&
              "@max-[18rem]/widget:min-w-0 @max-[18rem]/widget:gap-0.5 @max-[18rem]/widget:px-1.5",
          )}
        >
          <HugeiconsIcon icon={Location01Icon} className="size-3.5 shrink-0" strokeWidth={2} />
          {/* `tight`: başlıkta sayfa çevirici de varken dar kartta yalnız ikon (ad etikette). */}
          <span className={cn("min-w-0 truncate", tight && "@max-[18rem]/widget:hidden")}>
            {label}
          </span>
          {/* Mini kartta ok da düşer: hap yalnız iğne, "Tyrofy" adı kesilmesin. */}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn(
              "size-3 shrink-0",
              tight && "@max-[18rem]/widget:size-2.5 @max-[16rem]/widget:hidden",
            )}
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(70vh,28rem)] w-64 overflow-y-auto"
        onEscapeKeyDown={stopEscape}
      >
        {/* İki grup aynı değeri gösterir: arada "Tam konumumu kullan" eylemi var. */}
        <DropdownMenuRadioGroup value={selected} onValueChange={onChange}>
          <DropdownMenuRadioItem value="auto" className={cn(ITEM, "items-start")}>
            <span className="flex min-w-0 flex-col">
              <span>{t("widgets.radio.place.auto")}</span>
              {auto && place.city && (
                <span className="truncate text-[0.75rem] text-muted-foreground">
                  {[place.city, region(place.cc)].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {auto && place.approx && place.locateMe && (
          <DropdownMenuItem
            className={ITEM}
            disabled={place.locating}
            onSelect={(e) => {
              e.preventDefault()
              place.locateMe()
            }}
          >
            <HugeiconsIcon icon={Gps01Icon} className="size-3.5" strokeWidth={2} />
            {t(
              place.locating
                ? "widgets.radio.place.locating"
                : place.notice === "denied"
                  ? "widgets.radio.place.denied"
                  : "widgets.radio.place.locate",
            )}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("widgets.radio.place.offices")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selected} onValueChange={onChange}>
          {OFFICE_CITIES.map((c) => (
            <DropdownMenuRadioItem key={c.id} value={c.id} className={ITEM}>
              <span className="shrink-0">{c.names[locale] ?? c.names.en}</span>
              <span className="min-w-0 flex-1 truncate text-end text-[0.75rem] text-muted-foreground">
                {region(c.cc)}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[0.6875rem] text-muted-foreground">
          {t("widgets.radio.source")}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
