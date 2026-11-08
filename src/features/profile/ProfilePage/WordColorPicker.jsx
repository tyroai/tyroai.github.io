import { BrandText } from "@/components/brand/BrandText"
import { TyroLogo } from "@/components/brand/TyroLogo"
import { useLocale } from "@/hooks/useLocale"
import { usePalette } from "@/hooks/usePalette"
import { WORD_CORPORATE } from "@/lib/wordColor"
import { Swatches } from "./PaletteSwatches"
import { Group } from "./rows"
import { useRadioRoving } from "./useRadioRoving"

// Kurumsal seçenek de bir renk noktası: logodaki lacivert.
const CORPORATE = {
  id: WORD_CORPORATE,
  labelKey: "profile.prefs.wordCorporate",
  swatch: ["#1e467b"],
  group: "solid",
}

/**
 * "tyro" yazısının rengi — uygulama paletinden ayrı, yalnız burada seçilir. Seçenekler kurumsal
 * renk ve palet listesinin kendisi (düz: tek renk, degrade: yazı boyunca üç durak).
 */
export function WordColorPicker() {
  const { t } = useLocale()
  const { palettes, wordColor, setWordColor } = usePalette()
  const solid = [CORPORATE, ...palettes.filter((p) => p.group === "solid")]
  const gradient = palettes.filter((p) => p.group !== "solid")
  const radio = useRadioRoving(
    [...solid, ...gradient].map((p) => p.id),
    wordColor,
    setWordColor,
  )
  const current = [...solid, ...gradient].find((p) => p.id === wordColor) ?? CORPORATE

  return (
    <Group label={t("profile.prefs.wordColor")} footer={t("profile.prefs.wordColorHint")}>
      <div className="flex items-center gap-4 px-4 py-4">
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          <TyroLogo size={28} className="size-7 shrink-0" />
          <BrandText className="h-5" />
        </span>
        <span aria-live="polite" className="min-w-0 flex-1 truncate text-end text-sm font-semibold">
          {t(current.labelKey, current.id)}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={t("profile.prefs.wordColor")}
        className="space-y-4 px-4 py-4"
      >
        <Swatches
          label={t("palette.group.solid")}
          items={solid}
          palette={wordColor}
          setPalette={setWordColor}
          t={t}
          radio={radio}
          offset={0}
        />
        <Swatches
          label={t("palette.group.gradient")}
          items={gradient}
          palette={wordColor}
          setPalette={setWordColor}
          t={t}
          radio={radio}
          offset={solid.length}
        />
      </div>
    </Group>
  )
}
