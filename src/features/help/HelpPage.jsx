import "@/lib/i18n/help"
import { PageHeading } from "@/components/common/SectionHeading"
import { PageShell } from "@/components/layout/PageShell"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { useReducedMotion } from "motion/react"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { reveal } from "@/components/common/scrollReveal"
import { usePaneLayout } from "@/components/common/usePaneLayout"
import { useScrollSpy } from "@/components/common/useScrollSpy"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { usePageAccess } from "@/hooks/usePageAccess"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { pluralKey } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { HelpNav } from "./HelpNav"
import { HelpPages } from "./HelpPageList"
import { AskTyroRow, NoResults } from "./HelpResults"
import { HelpSearchField, PopularChips } from "./HelpSearchField"
import { HelpTours } from "./HelpTours"
import { HelpShortcuts } from "./HelpShortcuts"
import { HelpSupport } from "./HelpSupport"
import {
  POPULAR,
  faqDomId,
  faqFromHash,
  helpSpyIds,
  pageDomId,
  pageOfFaq,
  pageVisible,
  urlWithQuery,
} from "./helpContent"
import { PAGES } from "./helpPages"
import { matchesWords, queryTerms } from "./helpSearch"

// Genel asistan: yardım sorusu katalogdaki en genel asistana gider (AskBox ile aynı ad).
const OFFICE_AGENT = "tyroOffice"
const PAGE_PREFIX = pageDomId("")

// İki bölmeli düzen (15rem menü + ≥ 30rem içerik) kabın bu enin (px) altında sığmaz; Profil ile aynı eşik.
const PANE_MIN = 872
// Kap ortak (`PageShell`); geniş düzen Profil'in eni, dar düzen okuma eni — aynı sol kenardan.
const WIDE_BOX = "max-w-[76rem]"
const NARROW_BOX = "flex max-w-[56rem] flex-col"
const NARROW_STICKY =
  "sticky top-0 z-10 -mx-gutter bg-background px-gutter pb-3 pt-4 transition-[box-shadow] shortest:static sm:pt-6"
const WIDE_STICKY =
  "sticky top-0 z-10 bg-background pb-3 pt-4 transition-[box-shadow] shortest:static"

/**
 * Yardım merkezi: arama öncelikli karşılama, sayfa sayfa kılavuz (işlevler + sorular), kısayollar, destek.
 * Arama işlev ve soruların başlık + gövdesinde, kelimeler AND; eşleşen sayfa ve soru açık gelir; destek
 * hiç filtrelenmez.
 * Ayrıntı ve ölçümler: docs/features/yardim.md.
 */
export function HelpPage() {
  const { t, locale } = useLocale()
  const { canOpen } = usePageAccess()
  // Katalog bölümünün kapısı Profilim'inkiyle aynı: yalnız kesin "evet" (sorulamadıysa gösterilmez).
  const inAdminGroup = useIsInGroup(ADMIN_GROUP_ID) === true
  const { hash, search } = useLocation()
  const reduce = useReducedMotion()
  const fine = useMediaQuery("(pointer: fine)")
  const inputRef = useRef(null)
  const sentinel = useRef(null)
  const scroller = useRef(null)
  // Öğe durumda da tutulur: bölüm izleyici `ref` nesnesi değil öğeyi ister.
  const [scrollEl, setScrollEl] = useState(null)
  const bindScroller = useCallback((el) => {
    scroller.current = el
    setScrollEl(el)
  }, [])
  const wide = usePaneLayout(scroller, PANE_MIN)
  // Sorgu adreste (`?q=`): sonuçtaki bir bağlantıya gidip Geri'ye basan aramasını kaybetmez.
  const [query, setQuery] = useState(() => new URLSearchParams(search).get("q") ?? "")
  // Gezinmede açık olanlar; aramada eşleşenlerin hepsi açık gelir, KAPATILANLAR tutulur.
  const [open, setOpen] = useState(() => new Set())
  const [collapsed, setCollapsed] = useState(() => new Set())
  // Açık sayfa blokları (gezinmede; aramada eşleşen sayfa hep açık).
  const [openPages, setOpenPages] = useState(() => new Set())
  const openPage = (id) => setOpenPages((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  const [stuck, setStuck] = useState(false)

  // `#faq-qN`: soru açılır (arama temizlenir ki görünsün), kaydırma efektte.
  const [seenHash, setSeenHash] = useState(null)
  if (hash !== seenHash) {
    setSeenHash(hash)
    const n = faqFromHash(hash)
    if (n) {
      setQuery("")
      setCollapsed(new Set())
      setOpen((prev) => new Set(prev).add(n))
      openPage(pageOfFaq(n))
    }
  }
  useEffect(() => {
    const n = faqFromHash(hash)
    if (!n) return undefined
    const frame = requestAnimationFrame(() => {
      reveal(scroller.current, document.getElementById(faqDomId(n)), !reduce)
      document.getElementById(`${faqDomId(n)}-q`)?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash, reduce])

  // Router'a haber vermeden replaceState: her tuş bir gezinme (ve tüm ağacın yeniden çizimi) olmasın.
  useEffect(() => {
    const next = urlWithQuery(window.location.href, query)
    if (next) window.history.replaceState(window.history.state, "", next)
  }, [query])

  // Yapışkan arama kutusu takılınca ince alt çizgi (gözcü kutunun hemen üstünde).
  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === "undefined") return undefined
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const handleQuery = (next) => {
    setQuery(next)
    setCollapsed(new Set())
  }
  // Çip: telefonda kutuya odaklanmaz — klavye açılıp sonuçları örtmesin.
  const pick = (term) => {
    handleQuery(term)
    if (fine) inputRef.current?.focus()
  }

  const terms = useMemo(() => queryTerms(query), [query])
  const searching = terms.length > 0

  // Kapalı sayfanın bloğu gösterilmez; kısayol listesi telefonda yok, çapası da düz satır.
  const pages = useMemo(
    () => PAGES.filter((p) => pageVisible(p, { canOpen, inAdminGroup })),
    [canOpen, inAdminGroup],
  )
  // Arama işlevi ve soruyu SAYFA ADIYLA birlikte arar ("keşfet" Keşfet'in her satırını getirir).
  const entries = useMemo(() => {
    return pages
      .map((page) => {
        const name = t(`help.pages.${page.id}.title`)
        const hit = (text) => !searching || matchesWords(`${name} ${text}`, terms)
        const fns = page.functions
          .map((fn) => (fn.anchor && !fine ? { ...fn, anchor: undefined } : fn))
          .filter((fn) =>
            hit(
              `${t(`help.fn.${page.id}.${fn.id}.title`)} ${t(`help.fn.${page.id}.${fn.id}.body`)}`,
            ),
          )
        const faq = page.faq.filter((f) => hit(`${t(`help.faq.q${f.n}`)} ${t(`help.faq.a${f.n}`)}`))
        return { page, fns, faq }
      })
      .filter((e) => !searching || e.fns.length + e.faq.length > 0)
  }, [pages, searching, terms, fine, t])
  const hits = entries.reduce((sum, e) => sum + e.fns.length + e.faq.length, 0)

  const isOpen = (n) => (searching ? !collapsed.has(n) : open.has(n))
  const toggle = (n) => {
    const flip = (prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    }
    if (searching) setCollapsed(flip)
    else setOpen(flip)
  }

  // Sayfa içi çapa (sayfa bloğu, kısayollar, destek): kaydırır, odağı başlığına taşır. Hedef
  // aramada çizilmiyorsa önce arama temizlenir, kaydırma gezinme görünümü çizilince.
  const pendingAnchor = useRef(null)
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    reveal(scroller.current, el, !reduce)
    el?.querySelector("h2, h3")?.focus({ preventScroll: true })
  }
  // Hedef aramada da çiziliyorsa (eşleşen sayfa, destek) oraya iner; çizilmiyorsa (eşleşmeyen
  // sayfa, kısayollar) aramayı temizler ve gezinme görünümü çizilince iner.
  const goAnchor = (id) => {
    if (!searching || document.getElementById(id)) return scrollTo(id)
    pendingAnchor.current = id
    handleQuery("")
  }
  // Sol menü (iki bölmeli düzen): etkin bölüm kaydırmayı izler; aramada hiçbiri seçili değil.
  const { active, hold, watchEnd } = useScrollSpy(
    scrollEl,
    helpSpyIds({ pageIds: pages.map((p) => p.id), shortcuts: fine }),
    wide && !searching,
  )
  const jump = (id) => {
    // Menüden bir sayfaya inen, o sayfanın içeriğini de görmek ister: blok açılır.
    if (id.startsWith(PAGE_PREFIX)) openPage(id.slice(PAGE_PREFIX.length))
    hold(id)
    goAnchor(id)
  }
  useEffect(() => {
    if (searching || !pendingAnchor.current) return
    scrollTo(pendingAnchor.current)
    pendingAnchor.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching])

  // Bulunamayan soru genel asistana: sohbet rıhtımı sayfanın yanında açılır (Self Servis ile aynı yol).
  const ask = () => {
    setPendingAsk({ question: query.trim(), context: t("help.ask.context"), agent: OFFICE_AGENT })
    requestOpenChat({ focusComposer: fine })
  }

  const count = t(pluralKey("help.results.count", locale, hits), {
    n: new Intl.NumberFormat(locale).format(hits),
  })

  // Arama bloku ve bölümler iki düzende de aynı; yalnız kabı değişir.
  const searchBlock = (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-px shrink-0" />
      {/* Yapışkan arama: sayfa kayınca üstte kalır, takılınca ince çizgi. Üst pay < lg'de üstteki
          çentik tutamağının altında kalsın diye (Self Servis StickyBar ile aynı); yatay
          telefonda yapışmaz, kısa ekranın yarısını yemesin. */}
      <div
        className={cn(
          wide ? WIDE_STICKY : NARROW_STICKY,
          stuck && "shadow-[0_1px_0_var(--color-border)]",
        )}
      >
        <HelpSearchField query={query} onQuery={handleQuery} inputRef={inputRef} />
        {/* Canlı bölge hep yerinde (sonradan eklenen bölgeyi ekran okuyucu kaçırır); sonuç
            yoksa sayı yerine boş durum cümlesi okunur, görünür hâli aşağıda. */}
        <p
          role="status"
          className={cn(
            "mt-2 px-1 text-xs text-muted-foreground",
            (!searching || !hits) && "sr-only",
          )}
        >
          {searching ? (hits ? count : t("help.search.empty")) : ""}
        </p>
      </div>
      {searching ? null : (
        <div className="pb-1 pt-1">
          <PopularChips terms={POPULAR.map((i) => t(`help.popular.${i}`))} onPick={pick} />
        </div>
      )}
    </>
  )

  const sections = (
    <div className="mt-6 flex flex-col gap-8 @2xl/help:mt-8 @2xl/help:gap-10">
      {searching && hits === 0 ? (
        <NoResults
          onClear={() => {
            handleQuery("")
            inputRef.current?.focus()
          }}
          onAsk={ask}
        />
      ) : (
        <HelpPages
          entries={entries}
          heading={t("help.sections.pages")}
          searching={searching}
          terms={terms}
          expanded={(id) => openPages.has(id)}
          onTogglePage={(id) =>
            setOpenPages((prev) => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }
          isOpen={isOpen}
          onToggle={toggle}
          onAnchor={goAnchor}
          canOpen={canOpen}
        />
      )}
      {searching && hits > 0 ? <AskTyroRow query={query.trim()} onAsk={ask} /> : null}
      {searching ? null : <HelpTours />}
      {/* Kısayollar yalnız ince işaretçide görünür; telefonda hiç çizilmez. */}
      {searching || !fine ? null : <HelpShortcuts wide={wide} />}
      <HelpSupport query={searching ? query : ""} />
    </div>
  )

  return (
    // Dış kap kaydırır ve kap sorgusunun ölçüsüdür (sohbet rıhtımı açılınca daralır). Dar kapta
    // iç sütun okuma eni; geniş kapta Profil gibi solda başlık, sol menü ve içerik sütunu.
    <div
      ref={bindScroller}
      className="@container/help flex min-h-0 w-full flex-1 flex-col overflow-y-auto"
    >
      <PageShell notch={false} className="pb-16">
        <div className={wide ? WIDE_BOX : NARROW_BOX}>
          <PageHeading
            eyebrow={t("help.eyebrow")}
            title={t("help.title")}
            description={t("help.subtitle")}
            className={wide ? "mb-2" : undefined}
          />
          {wide ? (
            <div className="grid grid-cols-[15rem_minmax(0,1fr)] gap-10">
              <aside className="sticky top-0 self-start pt-4">
                <HelpNav current={active} onSelect={jump} pages={pages} shortcuts={fine} />
              </aside>
              <div className="@container/helpc flex min-w-0 flex-col">
                {searchBlock}
                {sections}
              </div>
            </div>
          ) : (
            <>
              {searchBlock}
              {sections}
            </>
          )}
        </div>
      </PageShell>
      {/* Bekçi kaydırıcının en sonunda: yalnız sayfanın dibine inilince görünür (bölüm izleyici). */}
      {wide ? <div ref={watchEnd} aria-hidden="true" className="h-px shrink-0" /> : null}
    </div>
  )
}
