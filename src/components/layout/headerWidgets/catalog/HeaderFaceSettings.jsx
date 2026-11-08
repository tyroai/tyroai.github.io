import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { Button } from "@/components/ui/button"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { LookMenu } from "@/features/widgets/LookMenu"
import { lookSwatch } from "@/features/widgets/lookSwatch"
import { rowNames } from "@/features/widgets/market/marketFormat"
import { baseLook, lookPalette } from "@/features/widgets/paletteTokens"
import { useCityTimes } from "@/features/widgets/worldclock/useCityTimes"
import { useLocale } from "@/hooks/useLocale"
import { useWorldClock } from "@/hooks/useWorldClock"
import { MARKET_CATALOG } from "@/lib/marketCatalog"
import { cn } from "@/lib/utils"
import { MARKET_FACE_MAX, faceLabelKey, faceOptionsOf, toggleCode } from "../faceOptions"
import { headerDescKey, headerLooksOf, headerTitleKey } from "../headerStore"
import { HeaderStrip } from "./HeaderStrip"

const LABEL = "text-[0.75rem] font-medium text-muted-foreground"
// Seçili hâli `headerCatalog.css`te (`.hc-chip[aria-pressed]`): ilk CSS'e sınıf eklenmesin.
const CHIP =
  "hc-chip inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-background px-3 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <p className={LABEL}>{label}</p>
      {children}
    </div>
  )
}

/** Dünya saatinin şehirleri (widget'ın listesi): kendiliğinden ya da biri. Denetim Merkezi de kullanır. */
export function CityPick({ value, onChange }) {
  const { t } = useLocale()
  const clock = useWorldClock()
  const now = useMinuteNow()
  const rows = useCityTimes({ home: clock.home, cities: clock.cities, now })
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label={t("headerWidgets.catalog.city")}
      className="h-9 w-full rounded-xl border border-input bg-transparent px-3 text-[0.8125rem] outline-none focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/25 pointer-coarse:h-11"
    >
      <option value="">{t("headerWidgets.catalog.cityAuto")}</option>
      {rows
        .filter((c) => !c.isHome)
        .map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.time}
          </option>
        ))}
    </select>
  )
}

/**
 * Kataloğun ayrıntısı: büyük önizleme (gerçek verinle), görünüm (kapsül), gösterilen bilgi, piyasada
 * kurlar (en çok iki), dünya saatinde şehir; header'a ekle ya da kaldır. Header'da olmayan widget'ın
 * seçimleri eklenince kaydedilir (`onAdd`).
 */
export function HeaderFaceSettings({
  id,
  inHeader,
  full,
  look,
  face,
  onLook,
  onFace,
  onAdd,
  onRemove,
}) {
  const { t, locale } = useLocale()
  const name = t(headerTitleKey(id))
  const opts = faceOptionsOf(id)
  const looks = headerLooksOf(id)
  const swatch = lookSwatch(baseLook(look), lookPalette(look))
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[1rem] font-semibold tracking-tight">{name}</h3>
        <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{t(headerDescKey(id))}</p>
      </div>
      <HeaderStrip id={id} chip={look} face={face} large />
      {looks.length > 1 && (
        <Field label={t("headerWidgets.catalog.look")}>
          <LookMenu
            name={name}
            looks={looks}
            look={look}
            onLook={onLook}
            showValue
            className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground/[0.05] ps-2 pe-3 text-[0.8125rem] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            <span
              aria-hidden="true"
              className={cn("size-4 rounded-full", swatch.className)}
              style={swatch.style}
            />
            {t(`widgets.look.${baseLook(look)}`)}
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 opacity-60" strokeWidth={2} />
          </LookMenu>
        </Field>
      )}
      {opts.shows.length > 1 && (
        <Field label={t("headerWidgets.catalog.show")}>
          <SegmentedControl
            fill
            label={t("headerWidgets.catalog.show")}
            value={face.show}
            onChange={(show) => onFace({ ...face, show })}
            options={opts.shows.map((value) => ({
              value,
              label: t(faceLabelKey(id, value)),
            }))}
            itemClassName="h-8 px-2 text-[0.75rem]"
          />
        </Field>
      )}
      {opts.codes && face.show !== "icon" && (
        <Field label={t("headerWidgets.catalog.codes", { n: MARKET_FACE_MAX })}>
          <div className="flex flex-wrap gap-1.5">
            {MARKET_CATALOG.filter((r) => r.key).map((r) => {
              const on = face.codes.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onFace({ ...face, codes: toggleCode(face.codes, r.id) })}
                  className={CHIP}
                >
                  {on && <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={2.4} />}
                  {rowNames(r, t, locale).short}
                </button>
              )
            })}
          </div>
        </Field>
      )}
      {opts.city && face.show !== "icon" && (
        <Field label={t("headerWidgets.catalog.city")}>
          <CityPick value={face.city} onChange={(city) => onFace({ ...face, city })} />
        </Field>
      )}
      <div className="space-y-2 pt-1">
        {inHeader ? (
          <Button variant="outline" className="w-full pointer-coarse:h-11" onClick={onRemove}>
            {t("headerWidgets.catalog.remove")}
          </Button>
        ) : (
          <Button className="w-full pointer-coarse:h-11" disabled={full} onClick={onAdd}>
            {t("headerWidgets.catalog.add")}
          </Button>
        )}
        {!inHeader && full && (
          <p className="text-[0.75rem] text-muted-foreground">{t("headerWidgets.catalog.full")}</p>
        )}
      </div>
    </div>
  )
}
