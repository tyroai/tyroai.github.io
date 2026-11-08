import { useEffect, useId, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { filterSections, foldText, normalizeItems, realValue } from "@/lib/optionItems"
import { cn } from "@/lib/utils"

const DEFAULT_STRINGS = {
  clear: "Clear search",
  empty: (q) => `No matches for “${q}”`,
}

/**
 * TELEFONDA SEÇİCİ — `ui/morph-select`in telefondaki karşılığı: tetik kapalı seçiciyle aynı kutu,
 * basınca alttan tam boy çekmece (`BottomSheet`; ekran klavyesine karşı korumalı). Yerinde
 * açılan liste telefonda form gövdesinin kalan yerine sığıyordu (uzun kategori listesinde iki
 * seçenek, klavye açıkken hiç); çekmecede aranabilir, 48 px'lik satırlı, kaydırılan tek liste
 * var. Seçili değer açılışta ortada. Aramalı listede klavye kendiliğinden açılmaz (liste
 * örtülmesin). Öğeler `ui/morph-select` ile aynı (`lib/optionItems`); Geri tuşu yalnız
 * çekmeceyi kapatır.
 */
export function SheetSelect({
  id,
  label,
  labelledBy,
  items,
  value,
  onValueChange,
  placeholder = "Select",
  searchable = "auto",
  searchPlaceholder,
  invalid = false,
  describedBy,
  strings: stringsProp,
  className,
}) {
  const strings = { ...DEFAULT_STRINGS, ...stringsProp }
  const uid = useId().replace(/:/g, "")
  const ownLabelId = `${uid}-label`
  const labelId = labelledBy ?? ownLabelId
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const chosenRef = useRef(null)
  // Dokunuşla açılınca ekran klavyesi kendiliğinden açılıp listeyi örtmesin; klavye ve fareyle
  // açılınca odak arama kutusuna gider.
  const touchRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const sections = useMemo(() => normalizeItems(items), [items])
  const all = useMemo(() => sections.flatMap((s) => s.options), [sections])
  const canSearch = searchable === "auto" ? all.length > 8 : searchable
  const selectedOption = value == null ? undefined : all.find((o) => o.value === value)
  const visible = useMemo(() => filterSections(sections, foldText(query.trim())), [sections, query])
  const firstSelected = visible.flatMap((s) => s.options).find((o) => realValue(o) === value)

  // Açılışta seçili satır görünür alanın ortasında.
  useEffect(() => {
    if (!open) return undefined
    const frame = requestAnimationFrame(() =>
      chosenRef.current?.scrollIntoView({ block: "center" }),
    )
    return () => cancelAnimationFrame(frame)
  }, [open])

  const close = (next) => {
    setOpen(next)
    if (!next) setQuery("")
  }
  const pick = (option) => {
    if (option.disabled) return
    const target = realValue(option)
    if (target !== value) onValueChange?.(target, option)
    close(false)
  }

  return (
    <div className={cn("relative w-full min-w-0 text-[0.875rem]", className)}>
      {!labelledBy && (
        <span id={ownLabelId} className="sr-only">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-labelledby={id ? `${labelId} ${id}` : labelId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => close(true)}
        onPointerDown={(e) => (touchRef.current = e.pointerType === "touch")}
        onKeyDown={() => (touchRef.current = false)}
        className={cn(
          "relative flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-border bg-background ps-3 pe-9 text-start font-medium whitespace-nowrap shadow-xs transition-[border-color,box-shadow] [-webkit-tap-highlight-color:transparent] [touch-action:manipulation] focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none",
          invalid && "border-destructive/70 ring-2 ring-destructive/15",
        )}
      >
        {selectedOption ? (
          <>
            {selectedOption.icon && (
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center text-muted-foreground"
              >
                {selectedOption.icon}
              </span>
            )}
            <span className="min-w-0 truncate">{selectedOption.label}</span>
          </>
        ) : (
          <span className="truncate font-normal text-muted-foreground">{placeholder}</span>
        )}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          aria-hidden="true"
          strokeWidth={1.8}
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </button>

      <BottomSheet
        open={open}
        onOpenChange={close}
        title={label}
        returnFocus={() => triggerRef.current}
        closeOnBack
        onOpenAutoFocus={(e) => {
          if (!canSearch || touchRef.current) return
          e.preventDefault()
          searchRef.current?.focus({ preventScroll: true })
        }}
        className={canSearch ? "data-[side=bottom]:h-[88dvh]" : undefined}
      >
        {canSearch && (
          <div className="sticky top-0 z-10 -mx-5 bg-background px-5 pb-2 pt-1">
            <div className="flex h-11 items-center gap-2 rounded-xl bg-foreground/[0.05] ps-3 pe-1.5 focus-within:ring-2 focus-within:ring-brand/30">
              <HugeiconsIcon
                icon={Search01Icon}
                aria-hidden="true"
                strokeWidth={1.8}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <input
                ref={searchRef}
                type="text"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder ?? label}
                className="no-ios-zoom h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  aria-label={strings.clear}
                  onClick={() => setQuery("")}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                </button>
              )}
            </div>
          </div>
        )}
        <div role="listbox" aria-labelledby={labelId} className="pb-3">
          {visible.map((section) => (
            <div
              key={section.key}
              role="group"
              aria-label={section.label || undefined}
              className="[&+&]:mt-1"
            >
              {section.label && (
                <div
                  aria-hidden="true"
                  className="px-3 pb-1 pt-3 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {section.label}
                </div>
              )}
              {section.options.map((o) => {
                const chosen = realValue(o) === value
                return (
                  <button
                    key={o.value}
                    ref={o === firstSelected ? chosenRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={chosen}
                    aria-disabled={o.disabled || undefined}
                    onClick={() => pick(o)}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-[0.9375rem] font-medium text-foreground/85 transition-colors active:bg-foreground/[0.06] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none aria-disabled:opacity-60",
                      chosen && "bg-brand/[0.08] text-foreground",
                    )}
                  >
                    {o.icon && (
                      <span
                        aria-hidden="true"
                        className="grid size-5 shrink-0 place-items-center text-muted-foreground"
                      >
                        {o.icon}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">{o.label}</span>
                    {o.meta && (
                      <span className="shrink-0 text-[0.75rem] text-muted-foreground tabular-nums">
                        {o.meta}
                      </span>
                    )}
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      aria-hidden="true"
                      strokeWidth={2}
                      className={cn(
                        "size-4 shrink-0 text-brand-ink",
                        chosen ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                )
              })}
            </div>
          ))}
          {!visible.length && (
            <p className="px-3 py-8 text-center text-[0.8125rem] text-muted-foreground">
              {strings.empty(query.trim())}
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
