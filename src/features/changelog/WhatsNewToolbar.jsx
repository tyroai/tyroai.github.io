import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { TextTabs } from "@/features/selfservice/board/TextTabs"
import { SearchField as ToolbarSearch } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { kindText } from "./entryText"

const KINDS = ["all", "feature", "improvement", "fix"]
// "Düzeltme" yalnız yöneticide: yönetici olmayanda o sekme hep "kayıt yok" diyen bozuk bir düğme olurdu.
const KINDS_PUBLIC = KINDS.filter((k) => k !== "fix")

/** Dokunmatikte "Ara" tuşu klavyeyi kapatır: sonuçlar görünsün. */
const blurOnTouch = (ref) => () => {
  if (window.matchMedia?.("(pointer: coarse)").matches) ref.current?.blur()
}

/**
 * Yeniliklerin arama kutusu = ortak `SearchField` (araç çubuğu boyu, "/" kısayolu, Esc temizler).
 * Ad burada kalır: geniş düzenin yan paneli de aynısını kullanır.
 */
export function SearchField({ query, onQuery, inputRef, className, autoFocus }) {
  const { t } = useLocale()
  return (
    <ToolbarSearch
      value={query}
      onChange={onQuery}
      inputRef={inputRef}
      placeholder={t("whatsNew.searchPlaceholder")}
      shortcut
      onSubmit={blurOnTouch(inputRef)}
      inputProps={{ autoFocus }}
      className={className}
    />
  )
}

/**
 * Yapışkan araç çubuğu: tür sekmeleri (sayılı) + arama. Geniş kapta tek satır; telefonda tek satır
 * eşit enli sekmeler + arama simgesi, arama açılınca kutu sekmelerin ÜSTÜNE biner (en az ile en
 * çok: gövde değerli). Takılınca ince alt çizgi; yatay telefonda yapışmaz (kısa ekranın yarısını
 * yemesin). Üst pay < lg'de üstteki çentik tutamağının altında kalsın diye (Yardım ile aynı).
 */
export function WhatsNewToolbar({ kind, onKind, counts, isAdmin, phone, query, onQuery }) {
  const { t } = useLocale()
  const inputRef = useRef(null)
  const sentinel = useRef(null)
  const [stuck, setStuck] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const showSearch = !phone || searchOpen || query !== ""

  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === "undefined") return undefined
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Telefonda sayı yok: dört sekme + sayı 360 px'e sığmıyor; sonuç sayısı altta canlı bölgede.
  // Sayı sekmenin içinde düz yazı (ortak hap rozeti AA vermiyordu: 10 px soluk gri, açık gri zeminde).
  const options = (isAdmin ? KINDS : KINDS_PUBLIC).map((k) => {
    const name = k === "all" ? t("whatsNew.kind.all") : kindText(t, k, !phone)
    return {
      value: k,
      label: phone ? (
        name
      ) : (
        <>
          {/* Düz boşluk, `ms-*` değil: Arapçada yerleşim LTR kalıp metin çift yönlü akıyor, kenar boşluğu yanlış tarafa düşerdi. */}
          {name} <span className="text-[0.8125rem] font-normal tabular-nums">{counts[k]}</span>
        </>
      ),
    }
  })

  const toggleSearch = () => {
    if (searchOpen) onQuery("")
    setSearchOpen((v) => !v)
  }

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-px shrink-0" />
      <div
        className={cn(
          "sticky top-0 z-10 -mx-gutter bg-background px-gutter pb-2 pt-4 transition-[box-shadow] shortest:static sm:pt-6",
          stuck && "shadow-[0_1px_0_var(--color-border)]",
        )}
      >
        {phone && showSearch ? (
          <SearchField
            query={query}
            onQuery={onQuery}
            inputRef={inputRef}
            autoFocus={searchOpen && query === ""}
            className="mb-1"
          />
        ) : null}
        <div className="flex items-center gap-1 @2xl/whatsnew:gap-3">
          <TextTabs
            options={options}
            value={kind}
            onChange={onKind}
            label={t("whatsNew.kindAria")}
            fill={phone && options.length <= 3}
            size={phone && options.length > 3 ? "sm" : "md"}
            // Dört sekme (yönetici) telefona dolgusuz sığmıyor: sıkı aralık + en az 44 px genişlik (dokunma hedefi).
            className={cn(
              "min-w-0 flex-1",
              phone && options.length > 3 && "gap-1 [&>button]:min-w-11 [&>button]:px-1",
            )}
          />
          {phone ? (
            <button
              type="button"
              onClick={toggleSearch}
              aria-label={t("whatsNew.searchOpen")}
              aria-expanded={showSearch}
              className="grid size-control shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-foreground/[0.06] aria-expanded:text-foreground"
            >
              <HugeiconsIcon
                icon={Search01Icon}
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
            </button>
          ) : (
            <SearchField
              query={query}
              onQuery={onQuery}
              inputRef={inputRef}
              className="w-56 shrink-0 @3xl/whatsnew:w-64"
            />
          )}
        </div>
      </div>
    </>
  )
}
