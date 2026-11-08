import { useRef } from "react"
import { SearchField } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useScrollFade } from "@/hooks/useScrollFade"
import { cn } from "@/lib/utils"

/**
 * Yardım'ın arama kutusu = ortak `SearchField` (araç çubuğu boyu; "/" kısayolu, Esc temizler ve
 * rıhtıma kaçmaz). Telefonda örnekli uzun ipucu kesilir; örnekler zaten POPÜLER çiplerinde.
 * Dokunmatikte "Ara" tuşu klavyeyi kapatır: sonuçlar görünsün.
 */
export function HelpSearchField({ query, onQuery, inputRef }) {
  const { t } = useLocale()
  const wide = useMediaQuery("(min-width: 640px)")
  return (
    <>
      <SearchField
        value={query}
        onChange={onQuery}
        inputRef={inputRef}
        label={t("help.search.aria")}
        placeholder={t(wide ? "help.search.placeholder" : "help.search.aria")}
        shortcut
        onSubmit={() => {
          if (window.matchMedia?.("(pointer: coarse)").matches) inputRef.current?.blur()
        }}
        inputProps={{ "aria-describedby": "help-search-hint" }}
      />
      <p id="help-search-hint" className="sr-only">
        {t("help.search.hint")}
      </p>
    </>
  )
}

/** Boş kutunun altında POPÜLER aramalar: "ne yazsam?" sorusunu tek dokunuşla cevaplar. */
export function PopularChips({ terms, onPick }) {
  const { t, locale } = useLocale()
  const strip = useRef(null)
  useScrollFade(strip, "x")
  return (
    // Grup adı ekran okuyucuya da: "kısayol" düğmesi tek başına ne yaptığını söylemiyor.
    // Dar kapta tek satır kayan şerit (RU'da çipler üç satır yiyordu); kenara taşar, devamı
    // olan yan solar. py-1: dokunmatikteki görünmez pay kayan kapta kırpılmasın.
    <div
      ref={strip}
      role="group"
      aria-labelledby="help-popular-label"
      className={cn(
        "-mx-4 -my-1 flex items-center gap-2 overflow-x-auto overscroll-x-contain px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[mask-image:linear-gradient(to_right,transparent,#000_var(--fade-start,0px),#000_calc(100%-var(--fade-end,0px)),transparent)]",
        "@2xl/help:mx-0 @2xl/help:my-0 @2xl/help:flex-wrap @2xl/help:gap-y-2.5 @2xl/help:overflow-visible @2xl/help:px-0 @2xl/help:py-0 @2xl/help:[mask-image:none]",
      )}
    >
      <span
        id="help-popular-label"
        lang={locale}
        className="me-1 shrink-0 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
      >
        {t("help.popular")}
      </span>
      {terms.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => onPick(term)}
          className={cn(
            // Standart çip: `control-sm` (dokunmatikte 44), çerçevesiz gri kapsül.
            "relative h-control-sm shrink-0 whitespace-nowrap rounded-full bg-foreground/[0.05] px-3 text-xs text-foreground/85 transition hover:bg-foreground/[0.09] hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-w-11",
          )}
        >
          {term}
        </button>
      ))}
    </div>
  )
}
