import { useRef } from "react"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { optionLabel } from "@/lib/promptTemplates"
import { cn } from "@/lib/utils"
import { fieldState } from "../field/fieldState"
import { IconTile } from "../field/IconTile"
import "../field/fieldTile.css"
import { capFirst } from "../formUi"
import { choiceIcon } from "./advanceLooks"
import { TILE_H, TIP_HIT } from "./advanceUi"

const KEYS = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }

/**
 * İki seçenekli alan (ödeme: banka · kasa; belge: belgeli · belgesiz) alan karosunun içinde:
 * solda seçime göre ikon (✓ rozetli), yanında etiket, iki seçenek hep görünür. Karo genişse
 * düğmeler etiketin sağında, darsa (dil ya da sütun) alt satırda — `flex-wrap`, yazının boyuna
 * göre kendiliğinden; iki hâlde de karo öteki karolarla aynı boyda. Seçenek yazısı kalın
 * hâlinin yerini tutar: seçince genişlik oynamaz, karoların sütun sayısı (`useTileColumns`)
 * seçime göre değişmez. Seçimin sonucu (`selfService.advance.effect.*`) ⓘ balonunda; avans
 * özetinde de yazılı. Radyo grubu: tek sekme durağı, oklar seçer.
 */
export function Segmented({ idBase, field, value, onChange }) {
  const { t, locale } = useLocale()
  const { name, slot } = field
  const id = `${idBase}-${name}`
  const refs = useRef([])
  const options = slot.options
  const effect = value ? t(`selfService.advance.effect.${value}`) : null

  const onKey = (e, i) => {
    const step = KEYS[e.key]
    if (!step) return
    e.preventDefault()
    const next = (i + step + options.length) % options.length
    onChange(name, options[next])
    refs.current[next]?.focus()
  }

  return (
    <div
      data-seg=""
      data-field={fieldState({ filled: Boolean(value) }) ?? undefined}
      className={cn(
        "req-tile flex w-full min-w-0 items-center gap-3 rounded-[0.875rem] px-3 py-1.5 pointer-coarse:min-h-16 pointer-coarse:py-[3px]",
        TILE_H,
      )}
    >
      <IconTile
        icon={choiceIcon(value, options[0])}
        swap={value}
        state={fieldState({ filled: Boolean(value) })}
      />
      <div
        data-seg-wrap=""
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-[3px]"
      >
        {/* Etiket satırı ve ⓘ piksel: alçak ekranda da balon düğmesi seçeneklerden yeterince uzak
            (WCAG 2.5.8 aralığı). */}
        <span className="flex h-[16px] min-w-0 shrink-0 items-center gap-0.5 text-[0.75rem] leading-4 text-muted-foreground pointer-coarse:h-5">
          <span id={`${id}-label`} className="truncate">
            {capFirst(t(`myspace.slot.${name}`), locale)}
          </span>
          <InfoTip
            text={effect}
            className={cn("-me-0.5 size-[16px] pointer-coarse:size-5", TIP_HIT)}
          />
        </span>
        <div
          id={id}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-describedby={effect ? `${id}-effect` : undefined}
          className="grid h-[28px] min-w-0 grow auto-cols-[minmax(0,1fr)] grid-flow-col gap-0.5 rounded-lg bg-foreground/[0.06] p-[2px] pointer-coarse:h-8"
        >
          {options.map((o, i) => {
            const on = value === o
            return (
              <button
                key={o}
                ref={(el) => {
                  refs.current[i] = el
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on || (!value && i === 0) ? 0 : -1}
                onClick={() => onChange(name, o)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  // Dokunmatikte vuruş alanı görünmez bir kenarla 44 px'e büyür; yukarıda az (ⓘ'ye
                  // değmesin), aşağıda çok.
                  "relative flex min-w-0 items-center justify-center whitespace-nowrap rounded-md px-2.5 text-[0.8125rem] leading-none transition-[color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-top-1 pointer-coarse:after:-bottom-3",
                  on
                    ? "bg-card font-semibold text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.1),0_0_0_0.5px_rgb(0_0_0/0.04)] dark:bg-white/[0.14]"
                    : "font-medium text-foreground/70 hover:text-foreground",
                )}
              >
                <OptionText text={capFirst(optionLabel(t, slot, o), locale)} />
              </button>
            )
          })}
        </div>
      </div>
      {effect && (
        <span id={`${id}-effect`} className="sr-only">
          {effect}
        </span>
      )}
    </div>
  )
}

/** Seçenek yazısı: görünmez kalın kopyası genişliği tutar (seçilince yazı kalınlaşır, kaymaz). */
function OptionText({ text }) {
  return (
    <span data-seg-text="" className="grid min-w-0">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 truncate font-semibold">
        {text}
      </span>
      <span className="col-start-1 row-start-1 truncate">{text}</span>
    </span>
  )
}
