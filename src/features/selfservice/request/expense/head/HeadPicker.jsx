import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { filterOptions, stepIndex } from "@/features/selfservice/lib/expenseHeadView"
import { cn } from "@/lib/utils"
import { INK } from "./headUi"

const LINE = "border-black/[0.06] dark:border-white/[0.08]"

/** Seçeneğin gövdesi: şirkette kod + unvan, kişide ad + e-posta (iki satır). */
function OptionBody({ o }) {
  if (o.code) {
    return (
      <span className="flex min-w-0 flex-1 items-baseline gap-3">
        <span className="w-12 shrink-0 text-[0.8125rem] font-semibold tabular-nums">{o.code}</span>
        <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-foreground/75">
          {o.label}
        </span>
      </span>
    )
  }
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-medium">{o.label}</span>
      {/* Vurgulu satırın gri zemininde de 4,5:1 kalsın diye soluk yazı biraz koyu. */}
      {o.sub && <span className="block truncate text-[0.75rem] text-foreground/65">{o.sub}</span>}
    </span>
  )
}

/**
 * Başlık şeridinin açılır listesi: tetik hücrenin kendisi (`children(open)`), liste hücrenin
 * altında Radix popover'da. `search`: arama kutusu (Türkçe katlamalı; dokunuşla açılınca ekran
 * klavyesi kendiliğinden açılmaz). Klavye: oklar, Home/End, PageUp/Down; Enter (aramasız listede
 * Boşluk da) seçer; Escape ve Tab kapatır, odak hücreye döner. `options`:
 * `{ value, label, sub?, code?, icon?, search?, split? }` — `split` öncesine ince çizgi çeker;
 * `icon` satırın başında (izin türünün ikon kutusu).
 * `note`: listenin altında görünür bilgi (yetki durumu gibi).
 */
export function HeadPicker({
  labelId,
  options,
  value,
  onPick,
  search = false,
  note,
  className,
  children,
}) {
  const { t } = useLocale()
  const uid = useId().replace(/:/g, "")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(null)
  const [said, setSaid] = useState("")
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const touchRef = useRef(false)
  // Etkin seçenek yalnız klavyeyle ve açılışta görünür alana kaydırılır (fareyle gezerken değil).
  const revealRef = useRef(false)

  const visible = useMemo(() => filterOptions(options, query), [options, query])
  const at = visible.findIndex((o) => o.value === active)
  const listId = `${uid}-list`
  const noteId = `${uid}-note`
  const optionId = (i) => `${uid}-o${i}`
  const activeId = at >= 0 ? `${uid}-o${at}` : null

  useEffect(() => {
    if (!open || !revealRef.current || !activeId) return
    revealRef.current = false
    const list = listRef.current
    const el = document.getElementById(activeId)
    if (!list || !el) return
    // scrollIntoView değil: popover yerleşmeden pencereyi ya da form gövdesini kaydırabiliyor.
    const pad = 6
    const top = el.offsetTop
    const bottom = top + el.offsetHeight
    if (top < list.scrollTop + pad) list.scrollTop = top - pad
    else if (bottom > list.scrollTop + list.clientHeight - pad)
      list.scrollTop = bottom - list.clientHeight + pad
  }, [open, activeId])

  const toggle = (next) => {
    if (next) {
      setQuery("")
      setActive(value)
      setSaid("")
      revealRef.current = true
    }
    setOpen(next)
  }
  const pick = (o) => {
    if (o.value !== value) onPick(o.value)
    setOpen(false)
  }
  const onQuery = (q) => {
    const next = filterOptions(options, q)
    const text = q.trim()
    setQuery(q)
    setActive(next[0]?.value ?? null)
    if (listRef.current) listRef.current.scrollTop = 0
    setSaid(
      !text
        ? ""
        : next.length
          ? t("selfService.form.matchCount", { n: next.length })
          : t("selfService.form.noMatch", { q: text }),
    )
  }
  const onKey = (e) => {
    const typing = e.currentTarget === inputRef.current
    if (e.key === "Tab") {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === "Enter" || (e.key === " " && !typing)) {
      e.preventDefault()
      if (at >= 0) pick(visible[at])
      return
    }
    if ((e.key === "Home" || e.key === "End") && typing && query) return
    const next = stepIndex(e.key, at, visible.length)
    if (next === null) return
    e.preventDefault()
    revealRef.current = true
    setActive(visible[next].value)
  }

  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger
        asChild
        aria-haspopup="listbox"
        onPointerDown={(e) => (touchRef.current = e.pointerType === "touch")}
        onKeyDown={(e) => {
          touchRef.current = false
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
          e.preventDefault()
          toggle(true)
        }}
      >
        {children(open)}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={12}
        // Radix içeriği "dialog": adını hücrenin etiketinden alır ("Kimin adına", "Şirket").
        aria-labelledby={labelId}
        // Sohbet rıhtımı Escape'i pencerede dinliyor: listeyi kapatan Escape rıhtımı kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          const target = search && !touchRef.current ? inputRef.current : listRef.current
          target?.focus({ preventScroll: true })
        }}
        className={cn(
          "flex max-h-[min(26rem,var(--radix-popover-content-available-height))] min-w-(--radix-popover-trigger-width) flex-col gap-0 overflow-hidden rounded-2xl border bg-popover p-0 text-[0.875rem] text-foreground shadow-[0_18px_40px_-14px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.05)] ring-0",
          "border-black/[0.08] dark:border-white/[0.12]",
          className,
        )}
      >
        {search && (
          <div className={cn("flex h-11 shrink-0 items-center gap-2 border-b ps-3.5 pe-1.5", LINE)}>
            <HugeiconsIcon
              icon={Search01Icon}
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-labelledby={labelId}
              aria-activedescendant={activeId ?? undefined}
              aria-describedby={note ? noteId : undefined}
              placeholder={t("myspace.template.search")}
              value={query}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={onKey}
              className="no-ios-zoom h-full min-w-0 flex-1 bg-transparent text-[0.875rem] outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                aria-label={t("selfService.form.searchClear")}
                onClick={() => {
                  onQuery("")
                  inputRef.current?.focus()
                }}
                className="relative grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2"
              >
                <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" className="size-3.5" />
              </button>
            )}
          </div>
        )}
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={search ? -1 : 0}
          aria-activedescendant={!search && activeId ? activeId : undefined}
          aria-describedby={!search && note ? noteId : undefined}
          onKeyDown={search ? undefined : onKey}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none [scrollbar-width:thin]"
        >
          {visible.map((o, i) => (
            <Fragment key={o.value}>
              {o.split && i > 0 && (
                <div aria-hidden="true" className={cn("mx-2.5 my-1 border-t", LINE)} />
              )}
              <div
                id={optionId(i)}
                role="option"
                aria-selected={o.value === value}
                data-active={i === at || undefined}
                onPointerMove={(e) => e.pointerType === "mouse" && i !== at && setActive(o.value)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                className="flex min-h-10 cursor-pointer select-none items-center gap-3 rounded-[0.625rem] px-2.5 py-1.5 transition-colors data-[active]:bg-foreground/[0.06] pointer-coarse:min-h-11"
              >
                {o.icon}
                <OptionBody o={o} />
                <HugeiconsIcon
                  icon={Tick02Icon}
                  aria-hidden="true"
                  strokeWidth={2}
                  className={cn(
                    "size-4 shrink-0",
                    INK,
                    o.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>
            </Fragment>
          ))}
        </div>
        {/* Liste kutusunda yalnız seçenek durur: "sonuç yok" yanında. */}
        {!visible.length && (
          <p className="-mt-1.5 px-4 pb-3 text-[0.8125rem] text-muted-foreground">
            {t("selfService.form.noMatch", { q: query.trim() })}
          </p>
        )}
        {note && (
          <p
            id={noteId}
            className={cn(
              "flex shrink-0 items-start gap-2 border-t px-3.5 py-2.5 text-[0.75rem] leading-snug text-muted-foreground",
              LINE,
            )}
          >
            <HugeiconsIcon
              icon={InformationCircleIcon}
              aria-hidden="true"
              className="mt-px size-3.5 shrink-0"
              strokeWidth={1.8}
            />
            {note}
          </p>
        )}
        <span role="status" aria-live="polite" className="sr-only">
          {said}
        </span>
      </PopoverContent>
    </Popover>
  )
}
