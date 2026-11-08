import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import File01Icon from "@hugeicons/core-free-icons/File01Icon"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import UserIcon from "@hugeicons/core-free-icons/UserIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { activeFilterCount, DATE_PRESETS, TYPE_FAMILIES } from "@/lib/filesQuery"
import { NEUTRAL_TONE } from "@/lib/fileMeta"
import { cn } from "@/lib/utils"
import { stopEscape } from "./menuEscape"

/**
 * BUL'UN SÜZGECİ — Tür · Tarih · Kişi TEK düğmede ("Filtreler", açık sayısı rozette).
 *
 * Eskiden üç açılır çip kapsam şeridinin yanında duruyordu; şeritle birlikte iki satır kalabalık
 * ediyordu. Şimdi bir düğme: masaüstünde açılır kutu, telefonda alttan çekmece — içerik aynı
 * (`FilterPanel`). Etkin süzgeçler şeridin altında kaldırılabilir çip (`ActiveChips`): durum
 * görünür, kapalıyken yer kaplamaz.
 */

const TYPE_OPTIONS = [
  ...TYPE_FAMILIES.map((f) => ({ id: f.id, tone: f.tone })),
  { id: "other", tone: NEUTRAL_TONE },
]
/** Kişi seçenekleri; OneDrive kimlik basamağında "others" SORULAMAZ ve çağıran onu çıkarır. */
const PERSON_OPTIONS = ["any", "me", "others"]

function typeSummary(types, t) {
  if (!types?.length) return ""
  const first = t(`myfiles.type.${types[0]}`)
  return types.length > 1 ? t("myfiles.filter.more", { first, count: types.length - 1 }) : first
}

/**
 * Tür sayısı (§12.16): sunucunun kümelemesinden ("≈") ya da yüklenenlerden. Bir tür SEÇİLİYKEN
 * gösterilmez: süzgeç öteki türleri sıfırlar, "0" yanlış bir şey söylerdi.
 */
function countLabel(counts, id, locale) {
  const n = counts?.counts?.[id]
  if (n == null) return ""
  const num = new Intl.NumberFormat(locale).format(n)
  return counts.approx ? `≈\u00a0${num}` : num
}

function Option({ checked, onClick, children, role = "checkbox" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      onClick={onClick}
      className="files-filter-opt"
    >
      {children}
    </button>
  )
}

function Group({ title, role, children, cols = 2 }) {
  const { locale } = useLocale()
  return (
    <div className="files-filter-group">
      <p lang={locale} className="files-filter-title">
        {title}
      </p>
      <div
        role={role}
        aria-label={role ? title : undefined}
        className="files-filter-grid"
        data-cols={cols}
      >
        {children}
      </div>
    </div>
  )
}

/** Süzgecin içeriği — açılır kutuda ve çekmecede aynısı. Seçim anında uygulanır. */
function FilterPanel({ filters, onFilter, showPerson, personOptions, typeCounts }) {
  const { t, locale } = useLocale()
  const shown = filters.types.length ? null : typeCounts
  const hasCounts = shown?.counts && Object.keys(shown.counts).length > 0
  return (
    <>
      <Group title={t("myfiles.filter.typeTitle")}>
        {TYPE_OPTIONS.map((o) => {
          const on = filters.types.includes(o.id)
          const c = countLabel(shown, o.id, locale)
          return (
            <Option
              key={o.id}
              checked={on}
              onClick={() =>
                onFilter({
                  types: on ? filters.types.filter((x) => x !== o.id) : [...filters.types, o.id],
                })
              }
            >
              <span
                aria-hidden="true"
                className="files-filter-dot"
                style={{ background: o.tone }}
              />
              <span className="min-w-0 flex-1 truncate">{t(`myfiles.type.${o.id}`)}</span>
              {c && <span className="files-filter-count">{c}</span>}
            </Option>
          )
        })}
      </Group>
      {hasCounts && (
        <p className="files-filter-note">
          {shown.approx ? t("myfiles.filter.approx") : t("myfiles.filter.countsLoaded")}
        </p>
      )}
      <Group title={t("myfiles.filter.dateTitle")} role="radiogroup">
        {["any", ...DATE_PRESETS].map((d) => (
          <Option
            key={d}
            role="radio"
            checked={(filters.date || "any") === d}
            onClick={() => onFilter({ date: d === "any" ? "" : d })}
          >
            {t(`myfiles.date.${d}`)}
          </Option>
        ))}
      </Group>
      {showPerson && (
        <Group
          title={t("myfiles.filter.personTitle")}
          role="radiogroup"
          cols={personOptions.length}
        >
          {personOptions.map((p) => (
            <Option
              key={p}
              role="radio"
              checked={(filters.person || "any") === p}
              onClick={() => onFilter({ person: p === "any" ? "" : p })}
            >
              {t(`myfiles.person.${p}`)}
            </Option>
          ))}
        </Group>
      )}
      {/* "Sen"in kapsamı açık değil: oluşturduğun YA DA son değiştirdiğin. */}
      {showPerson && filters.person === "me" && (
        <p className="files-filter-note">{t("myfiles.person.meHint")}</p>
      )}
    </>
  )
}

function PanelFooter({ count, onClearAll, onDone }) {
  const { t } = useLocale()
  return (
    <div className="files-filter-foot">
      {count > 0 && (
        <button type="button" onClick={onClearAll} className="files-filter-clear">
          {t("myfiles.filter.clearAll")}
        </button>
      )}
      <button type="button" onClick={onDone} className="files-filter-done">
        {t("myfiles.filter.done")}
      </button>
    </div>
  )
}

/**
 * "Filtreler" düğmesi: geniş kapsayıcıda simge + ad, darda yalnız simge (ad `aria-label`da).
 * Telefonda (yatay telefon dahil) çekmece, öbür her yerde düğmenin altında açılır kutu.
 */
export function FilterButton({
  filters,
  onFilter,
  onClearAll,
  showPerson,
  personOptions = PERSON_OPTIONS,
  typeCounts = null,
}) {
  const { t } = useLocale()
  const phone = useIsMobile()
  const [open, setOpen] = useState(false)
  const count = activeFilterCount(filters)
  const panel = { filters, onFilter, showPerson, personOptions, typeCounts }
  const footer = <PanelFooter count={count} onClearAll={onClearAll} onDone={() => setOpen(false)} />
  const trigger = (
    <button
      type="button"
      onClick={phone ? () => setOpen(true) : undefined}
      aria-label={count ? t("myfiles.filter.openCount", { count }) : t("myfiles.filter.open")}
      className={cn("files-filter-btn", count > 0 && "is-active")}
    >
      <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" strokeWidth={1.9} />
      <span aria-hidden="true" className="files-filter-btn-label">
        {t("myfiles.filter.open")}
      </span>
      {count > 0 && (
        <span aria-hidden="true" className="files-filter-badge">
          {count}
        </span>
      )}
    </button>
  )

  if (phone)
    return (
      <>
        {trigger}
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title={t("myfiles.filter.open")}
          description={t("myfiles.filter.sheetHint")}
          onEscapeKeyDown={stopEscape}
          footer={footer}
        >
          <div className="files-filter-panel">
            <FilterPanel {...panel} />
          </div>
        </BottomSheet>
      </>
    )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        onEscapeKeyDown={stopEscape}
        aria-label={t("myfiles.filter.open")}
        className="files-filter-pop"
      >
        <div className="files-filter-panel">
          <FilterPanel {...panel} />
        </div>
        {footer}
      </PopoverContent>
    </Popover>
  )
}

/** Etkin süzgeçler — her biri tek dokunuşla kalkar; ikiden fazlaysa "Tümünü temizle". */
export function ActiveChips({ filters, onFilter, onClearAll }) {
  const { t } = useLocale()
  const chips = [
    filters.types?.length && {
      key: "types",
      icon: File01Icon,
      label: t("myfiles.filter.type"),
      value: typeSummary(filters.types, t),
      clear: { types: [] },
    },
    filters.date && {
      key: "date",
      icon: Calendar03Icon,
      label: t("myfiles.filter.date"),
      value: t(`myfiles.date.${filters.date}`),
      clear: { date: "" },
    },
    filters.person && {
      key: "person",
      icon: UserIcon,
      label: t("myfiles.filter.person"),
      value: t(`myfiles.person.${filters.person}`),
      clear: { person: "" },
    },
  ].filter(Boolean)
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onFilter(c.clear)}
          aria-label={t("myfiles.filter.remove", { label: `${c.label}: ${c.value}` })}
          className="files-active-chip"
        >
          <HugeiconsIcon icon={c.icon} className="size-3.5 text-brand" strokeWidth={1.9} />
          {c.value}
          <HugeiconsIcon icon={Cancel01Icon} className="size-3 opacity-70" strokeWidth={2.2} />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={onClearAll} className="files-filter-clear">
          {t("myfiles.filter.clearAll")}
        </button>
      )}
    </div>
  )
}
