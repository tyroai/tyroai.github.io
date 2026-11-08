import { HugeiconsIcon } from "@hugeicons/react"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import Sun03Icon from "@hugeicons/core-free-icons/Sun03Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { LOCALES } from "@/providers/LocaleProvider"
import { useLocale } from "@/hooks/useLocale"
import { usePalette } from "@/hooks/usePalette"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import PanelRightIcon from "@hugeicons/core-free-icons/PanelRightIcon"
import { NotchEditButton } from "@/components/layout/notch/NotchEdit"
import { EdgeNotchDesignPicker } from "../EdgeNotchDesignPicker"
import { OrbStylePicker } from "../OrbStylePicker"
import { GROUP_LABEL, Group, Row } from "./rows"
import { paletteFamilies } from "@/features/profile/lib/colorFamily"
import { Swatches } from "./PaletteSwatches"
import { swatchStyle } from "./swatchStyle"
import { useRadioRoving } from "./useRadioRoving"
import { WordColorPicker } from "./WordColorPicker"

/** Seçmeli bölüm (orb, çentik): kendi kartları var, gövde zemini istemez. */
function PickerBlock({ label, footer, children }) {
  const { locale } = useLocale()
  return (
    <section className="space-y-2">
      <h3 lang={locale} className={cn(GROUP_LABEL, "px-4")}>
        {label}
      </h3>
      {children}
      {footer ? (
        <p className="px-4 text-xs leading-relaxed text-muted-foreground">{footer}</p>
      ) : null}
    </section>
  )
}

/**
 * Görünüm — dil, tema, palet, orb, çentik. Header'daki düğmelerle aynı sağlayıcılara yazar
 * (ikinci durum yok); seçim anında uygulanır, "Kaydet" yok: sonuç ekranın kendisi.
 * Dil en üstte, çünkü altındaki her etiket o dilde yeniden okunur.
 */
export function AppearanceSection({ onOpenSection }) {
  const { t, locale, setLocale } = useLocale()
  const { preference, setTheme } = useTheme()
  const { palette, setPalette, palettes } = usePalette()
  const current = palettes.find((p) => p.id === palette)
  const solid = palettes.filter((p) => p.group === "solid")
  const gradient = palettes.filter((p) => p.group !== "solid")
  const radio = useRadioRoving(
    [...solid, ...gradient].map((p) => p.id),
    palette,
    setPalette,
  )

  return (
    <div className="space-y-8">
      <Group label={t("header.language")} footer={t("profile.prefs.languageHint")}>
        {LOCALES.map((code) => {
          const selected = locale === code
          return (
            <button
              key={code}
              type="button"
              aria-pressed={selected}
              onClick={() => setLocale(code)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 pointer-coarse:min-h-14",
                selected ? "bg-brand/[0.07]" : "hover:bg-foreground/[0.03]",
              )}
            >
              <span lang={code} className={cn("flex-1 text-sm", selected && "font-semibold")}>
                {t(`locale.${code}`)}
              </span>
              {selected ? (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  className="size-4 text-brand-ink"
                  strokeWidth={2.2}
                />
              ) : null}
            </button>
          )
        })}
      </Group>

      <Group>
        <Row label={t("profile.prefs.theme")}>
          <SegmentedControl
            label={t("profile.prefs.theme")}
            value={preference}
            onChange={setTheme}
            options={[
              { value: "light", label: t("profile.prefs.light"), icon: Sun03Icon },
              { value: "dark", label: t("profile.prefs.dark"), icon: Moon02Icon },
            ]}
          />
        </Row>
      </Group>

      <Group footer={t("profile.prefs.paletteHint")}>
        {current ? (
          <div aria-live="polite" className="flex items-center gap-4 px-4 py-4">
            <span
              aria-hidden="true"
              style={swatchStyle(current)}
              className="h-12 w-20 shrink-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{t("palette.selected")}</span>
              <span className="block truncate text-base font-semibold text-foreground">
                {t(current.labelKey, current.id)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {paletteFamilies(current.swatch)
                  .map((f) => t(`palette.hue.${f}`))
                  .join(" · ")}
              </span>
            </span>
          </div>
        ) : null}
        <div role="radiogroup" aria-label={t("palette.title")} className="space-y-4 px-4 py-4">
          <Swatches
            label={t("palette.group.solid")}
            items={solid}
            palette={palette}
            setPalette={setPalette}
            t={t}
            radio={radio}
            offset={0}
          />
          <Swatches
            label={t("palette.group.gradient")}
            items={gradient}
            palette={palette}
            setPalette={setPalette}
            t={t}
            radio={radio}
            offset={solid.length}
          />
        </div>
      </Group>

      <WordColorPicker />

      <PickerBlock label={t("profile.prefs.orbStyle")} footer={t("profile.prefs.orbStyleHint")}>
        <OrbStylePicker />
      </PickerBlock>

      <PickerBlock
        label={t("profile.prefs.notchDesign")}
        footer={t("profile.prefs.notchDesignHint")}
      >
        <EdgeNotchDesignPicker />
        {/* Yuvalar: Anasayfa'nın düzenleme çubuğundakiyle aynı seçici. */}
        <div className="px-4">
          <NotchEditButton className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-[0.8125rem] font-medium text-foreground/80 transition pointer-coarse:h-11 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-accent">
            <HugeiconsIcon
              icon={PanelRightIcon}
              className="size-4"
              strokeWidth={2}
              aria-hidden="true"
            />
            {t("notch.edit")}
          </NotchEditButton>
        </div>
      </PickerBlock>

      <p className="px-4 text-xs leading-relaxed text-muted-foreground">
        {t("profile.prefs.browserOnly")}{" "}
        <button
          type="button"
          onClick={() => onOpenSection?.("storage")}
          className="relative font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:underline pointer-coarse:after:absolute pointer-coarse:after:-inset-3"
        >
          {t("profile.prefs.browserOnlyLink")}
        </button>
      </p>
    </div>
  )
}
