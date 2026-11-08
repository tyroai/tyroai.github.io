import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import ArrowUpDownIcon from "@hugeicons/core-free-icons/ArrowUpDownIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { CHIP, CHIP_OFF, CHIP_ON } from "@/features/selfservice/chips"
import { ActionButton } from "@/components/common/ActionButton"
import { Fab } from "@/components/common/Fab"
import { SearchField } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { STATUSES } from "./catalogLogic"
import { PhoneFilter } from "./PhoneFilter"

const DOT = { on: "bg-success", off: "bg-muted-foreground/50" }

/**
 * Durum filtresi Self Servis'in durum çipleriyle aynı giysi (`selfservice/chips`): tür sekmesinin
 * altında ikinci bir altı çizili şerit "sekme içinde sekme" gibi okunuyordu. Seçili = zemin.
 * "Tümü"nün sayısı yok: aynı sayı hemen üstteki tür sekmesinde yazılı (bir şey bir yerde).
 */
function StatusFilter({ status, onStatus, counts }) {
  const { t } = useLocale()
  return (
    <div role="group" aria-label={t("settings.catalog.filter.label")} className="flex gap-0.5">
      {STATUSES.map((s) => {
        const on = s === status
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => onStatus(s)}
            className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}
          >
            {DOT[s] && (
              <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOT[s])} />
            )}
            {t(`settings.catalog.filter.${s}`)}
            {s !== "all" && (
              <span className="text-[0.75rem] font-normal tabular-nums text-muted-foreground">
                {counts[s]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Arama kutusu: ortak `SearchField` ("/" ile odak, dolu kutuda Esc temizler). */
function CatalogSearch({ kind, query, onQuery, short }) {
  const { t } = useLocale()
  const label = t(`settings.catalog.search.${kind}`)
  return (
    <SearchField
      value={query}
      onChange={onQuery}
      // Dar kutuda uzun ipucu kesiliyordu ("İş uygulamalarında…"): telefonda kısa; ad tam kalır.
      placeholder={short ? t("settings.catalog.search.short") : label}
      label={label}
      shortcut
      className="flex-1"
    />
  )
}

const PRIMARY =
  "inline-flex shrink-0 items-center justify-center gap-1.5 bg-brand-fill-deep font-medium text-brand-on-brand transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
const FLOAT =
  "pointer-events-auto h-12 rounded-full px-5 text-[0.875rem] shadow-[0_6px_20px_-6px_var(--brand)]"

/** Başparmak bölgesinde yüzen yuva. Kap sorgulu ata (`@container`) sabit konumlu çocuğun kabı olur: `body`'ye taşınır. */
function Floating({ children, center = false }) {
  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30",
        center ? "inset-x-0 flex justify-center" : "end-4",
      )}
    >
      {children}
    </div>,
    document.body,
  )
}

/** Birincil eylem: masaüstünde araç çubuğunda tek dolu düğme; telefonda ortak yüzen düğme (`Fab`). */
function NewButton({ kind, phone, onNew }) {
  const { t } = useLocale()
  const label = t(`settings.catalog.new.${kind}`)
  if (phone) return <Fab icon={Add01Icon} label={label} onClick={onNew} />
  return (
    <ActionButton tone="prominent" size="toolbar" onClick={onNew}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
      {label}
    </ActionButton>
  )
}

/**
 * Sırala kipinden çıkış, yüzen birincil eylemin yerinde (iOS "Bitti"): uzun listenin dibinde de
 * elde. Kipe girerken odaktaki "Sırala" çekildiği için odak buraya gelir.
 */
function DoneButton({ onDone }) {
  const { t } = useLocale()
  const ref = useRef(null)
  useEffect(() => ref.current?.focus({ preventScroll: true }), [])
  return (
    // Ortada: sağ kenarda satırların ↑/↓ düğmeleri var, yüzen hap onları örtmesin.
    <Floating center>
      <button ref={ref} type="button" onClick={onDone} className={cn(PRIMARY, FLOAT)}>
        <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
        {t("settings.catalog.sort.done")}
      </button>
    </Floating>
  )
}

/**
 * Tür başına araç çubuğu: arama · durum filtresi (Tümü/Açık/Kapalı, sayılı) · "Yeni …". Telefonda
 * ek olarak "Sırala" kipi (sürükleme yerine ↑/↓); kip açıkken arama ve filtre çekilir.
 */
export function CatalogToolbar({
  kind,
  phone,
  query,
  onQuery,
  status,
  onStatus,
  counts,
  sortMode,
  onSortMode,
  onNew,
  canSort,
  showFab = true,
}) {
  const { t } = useLocale()
  const sortRef = useRef(null)
  const wasSorting = useRef(sortMode)
  // Kipten çıkınca odak "Sırala"ya döner ("Bitti" yüzen yuvadaydı ve çekildi).
  useEffect(() => {
    if (wasSorting.current && !sortMode) sortRef.current?.focus({ preventScroll: true })
    wasSorting.current = sortMode
  }, [sortMode])

  if (phone) {
    // Sırala kipinde arama ve filtre çekilir, yerinde kapsam notu; çıkış yüzen "Bitti".
    if (sortMode) {
      return (
        <>
          <p className="text-xs text-muted-foreground">{t("settings.catalog.scopeNote")}</p>
          {showFab && <DoneButton onDone={() => onSortMode(false)} />}
        </>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <CatalogSearch kind={kind} query={query} onQuery={onQuery} short />
        <PhoneFilter status={status} onStatus={onStatus} counts={counts} />
        {canSort && (
          <button
            ref={sortRef}
            type="button"
            onClick={() => onSortMode(true)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-foreground/[0.045] px-3.5 text-[0.8125rem] font-medium text-foreground/85 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={ArrowUpDownIcon} className="size-4" strokeWidth={1.8} />
            {t("settings.catalog.sort.start")}
          </button>
        )}
        {showFab && <NewButton kind={kind} phone onNew={onNew} />}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex min-w-[14rem] max-w-xs flex-1">
        <CatalogSearch kind={kind} query={query} onQuery={onQuery} />
      </div>
      <StatusFilter status={status} onStatus={onStatus} counts={counts} />
      <span className="flex-1" />
      <NewButton kind={kind} onNew={onNew} />
    </div>
  )
}
