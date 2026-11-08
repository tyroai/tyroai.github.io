import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/** Odak bir yazı alanındayken "/" yazıdır, kısayol değil. */
function typing(target) {
  const el = target instanceof Element ? target : null
  return Boolean(
    el?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']"),
  )
}

/**
 * UYGULAMANIN TEK ARAMA KUTUSU — araç çubuğu ölçüsü (`h-control`: 36, dokunmatikte 44), macOS
 * arama alanı gibi çerçevesiz hafif dolgulu kapsül; odakta kart zemini ve marka halkası.
 * Dolu kutuda kendi temizle düğmesi ve Escape (rıhtıma kaçmaz). `shortcut`: "/" ile odak (görünürken;
 * sayfada bir kutu) ve farede ipucunda "Kısayol: /" (kutuda görünür işaret yok); kısayolu sayfa kendisi dinliyorsa yalnız `hint`. `onSubmit`: Enter. Ayrıntı: `docs/design-system.md` ›
 * Araç çubuğu standardı.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  shortcut = false,
  hint = shortcut,
  onSubmit,
  inputRef,
  busy = false,
  className,
  inputClassName,
  inputProps,
}) {
  const { t } = useLocale()
  // Telefonda uzun ipucu kutuya sığmıyordu ("Kişi, ofis ya da dosy…"): görünen yazı kısa "Ara…",
  // tam metin ekran okuyucuda (`aria-label`) ve odakta değişmez.
  const phone = useIsMobile()
  const own = useRef(null)
  const input = inputRef ?? own

  useEffect(() => {
    if (!shortcut) return undefined
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
      if (!input.current || input.current.offsetParent === null) return
      // Açık pencerede "/" pencereye ait; arkadaki kutuya atlamaz.
      if (document.querySelector("[role=dialog]")) return
      e.preventDefault()
      input.current.focus()
      input.current.select()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcut, input])

  return (
    // Kap `div`: içinde temizle düğmesi var (etiket bir düğmeyi saramaz); ad `aria-label`dan.
    <div className={cn("relative flex h-control min-w-0 items-center", className)}>
      <HugeiconsIcon
        icon={Search01Icon}
        aria-hidden="true"
        strokeWidth={1.9}
        className={cn(
          "pointer-events-none absolute start-3 size-4 text-muted-foreground",
          busy && "animate-pulse text-brand-ink motion-reduce:animate-none",
        )}
      />
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) {
            e.preventDefault()
            onSubmit()
          }
          // Dolu kutuda Escape temizler ve rıhtıma kaçmaz.
          if (e.key === "Escape" && value) {
            e.stopPropagation()
            e.preventDefault()
            onChange("")
          }
        }}
        placeholder={phone ? t("header.search") : placeholder}
        aria-label={label ?? placeholder}
        aria-keyshortcuts={hint ? "/" : undefined}
        // Kısayol yalnız farede ipucunda: kutudaki görünür "/" işareti ne olduğu anlaşılmıyordu
        // (ürün sahibi).
        title={hint ? t("toolbar.searchShortcut") : undefined}
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        {...inputProps}
        // `no-ios-zoom`: dokunmatikte 16 px — Safari daha küçük yazılı alana odaklanınca yakınlaşır.
        className={cn(
          "no-ios-zoom peer h-full w-full min-w-0 rounded-full border border-transparent bg-foreground/[0.045] ps-9 text-callout font-normal text-foreground outline-none transition placeholder:text-muted-foreground hover:bg-foreground/[0.06] focus-visible:border-brand/50 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-brand/20 [&::-webkit-search-cancel-button]:appearance-none",
          value ? "pe-11 pointer-fine:pe-9" : "pe-3",
          inputClassName,
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("")
            input.current?.focus()
          }}
          aria-label={t("toolbar.searchClear")}
          className="absolute end-0 grid size-control place-items-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </button>
      ) : null}
    </div>
  )
}
