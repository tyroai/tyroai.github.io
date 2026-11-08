import "@/lib/i18n/help"
import { useCallback, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { PageHeading } from "@/components/common/SectionHeading"
import { PageShell } from "@/components/layout/PageShell"
import { reveal } from "@/components/common/scrollReveal"
import { usePaneLayout } from "@/components/common/usePaneLayout"
import { useScrollSpy } from "@/components/common/useScrollSpy"
import { usePhoneLayout } from "@/features/selfservice/layout/phone"
import { useLocale } from "@/hooks/useLocale"
import { pluralKey } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { Timeline } from "./Timeline"
import { longDate, PAGE_SIZE } from "./changelogList"
import { useChangelogView, useTimeline } from "./useChangelogView"
import { WhatsNewSide } from "./WhatsNewSide"
import { WhatsNewToolbar } from "./WhatsNewToolbar"

// İki bölmeli düzen (15rem panel + içerik) kabın bu enin (px) altında sığmaz; Profil ile aynı eşik.
const PANE_MIN = 872
// Kap ortak (`PageShell`: kenar ve üst pay her sayfada aynı); geniş düzen Profil'in eni, dar düzen
// okuma eni — ikisi de aynı sol kenardan başlar.
const WIDE_BOX = "max-w-[76rem]"
const NARROW_BOX = "flex max-w-3xl flex-col"

/**
 * YENİLİKLER (`/whats-new`) — tam liste. Pencere bir ÖZET, burası arşiv: kaşlı sayfa başlığı,
 * cevap-önce satırı ("son ziyaretinden bu yana N yenilik"), tür sekmeleri + arama, gün gün zaman
 * çizgisi. Geniş kapta solda panel (arama, tür süzgeci, ay dizini), sağda zaman çizgisi; dar kapta
 * yapışkan araç çubuğu. Durum ve türetmeler `useChangelogView`; ayrıntı ve kararlar: docs/features/yenilikler.md.
 *
 * ⚠️ SAYFAYI AÇMAK OKUNDU SAYILIR (sayaç sönsün); noktalar ise sayfa AÇILIRKEN okunan işarete göre.
 * ⚠️ "DAHA FAZLA GÖSTER", sayfalama değil: zaman akışında sayfa sınırı grubun ortasından geçerdi;
 * düğme kaç kayıt kaldığını yazar. Arama ve süzgeç tüm kayıtlarda çalışır.
 */
export function WhatsNewPage() {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const scroller = useRef(null)
  // Öğe durumda da tutulur: bölüm izleyici `ref` nesnesi değil öğeyi ister.
  const [scrollEl, setScrollEl] = useState(null)
  const bindScroller = useCallback((el) => {
    scroller.current = el
    setScrollEl(el)
  }, [])
  const searchRef = useRef(null)
  const pendingDay = useRef(null)
  const phone = usePhoneLayout(scroller)
  const wide = usePaneLayout(scroller, PANE_MIN)
  const view = useChangelogView()
  const timeline = useTimeline(view, locale)
  // Bugün/Dün etiketleri için gün, ziyaret boyunca sabit.
  const [today] = useState(() => new Date())
  const unread = view.unreadIds.size

  // Ay dizini: görünen gün gruplarını izler; etkin gün ayına çevrilir.
  const dayIds = timeline.groups.map((g) => `day-${g.date}`)
  const { active, hold, watchEnd } = useScrollSpy(scrollEl, dayIds, wide)
  const currentMonth = active ? `month-${active.slice(4, 11)}` : null
  const showMore = () => view.setLimit(timeline.effectiveLimit + PAGE_SIZE)
  // Henüz yüklenmemiş aya basılırsa kırpma o ayın ilk kaydından bir sayfa ötesine açılır (tek kayıtlık
  // kırıntı kalmasın), kaydırma çizilince (efekt) yapılır.
  const jumpMonth = (month) => {
    if (!month) return
    hold(`month-${month.key}`)
    if (month.index >= timeline.effectiveLimit) {
      pendingDay.current = month.date
      view.setLimit(month.index + PAGE_SIZE)
      return
    }
    reveal(scroller.current, document.getElementById(`day-${month.date}`), !reduce)
  }
  useEffect(() => {
    const date = pendingDay.current
    const el = date ? document.getElementById(`day-${date}`) : null
    if (!el) return
    pendingDay.current = null
    reveal(scroller.current, el, false)
  }, [timeline.groups])

  // Cevap-önce: okunmamış varsa sayı, yoksa "hepsini gördün"; ilk ziyarette sayfanın tanımı.
  let answer = t("whatsNew.page.subtitle")
  if (unread > 0) answer = t("whatsNew.dialog.subtitle", { n: unread })
  else if (view.returning && view.latest)
    answer = t("whatsNew.page.upToDate", { date: longDate(view.latest.date, locale) })

  const clear = () => {
    view.setQuery("")
    view.setKind("all")
  }
  const status = t(pluralKey("help.results.count", locale, timeline.total), {
    n: new Intl.NumberFormat(locale).format(timeline.total),
  })
  // Canlı bölge hep yerinde (sonradan eklenen bölgeyi ekran okuyucu kaçırır); süzgeç yokken yalnız okunur.
  const liveStatus = (
    <p
      role="status"
      className={cn(
        "px-1 pb-1 pt-2 text-xs text-muted-foreground",
        !timeline.filtered && "sr-only",
      )}
    >
      {timeline.total > 0 ? status : ""}
    </p>
  )
  const list = (
    <Timeline
      groups={timeline.groups}
      unreadIds={view.unreadIds}
      targetId={view.targetId}
      terms={timeline.terms}
      divider={timeline.divider}
      today={today}
      remaining={timeline.remaining}
      onMore={showMore}
      onClear={clear}
    />
  )

  return (
    // Dış kap kaydırır ve kap sorgusunun ölçüsüdür (sohbet rıhtımı açılınca daralır). Dar kapta
    // iç sütun okuma eni; geniş kapta Profil gibi solda başlık, sol panel ve zaman çizgisi.
    <div
      ref={bindScroller}
      className="@container/whatsnew flex min-h-0 w-full flex-1 flex-col overflow-y-auto"
    >
      <PageShell notch={false} className="pb-16">
        <div className={wide ? WIDE_BOX : NARROW_BOX}>
          <PageHeading
            eyebrow={t("whatsNew.eyebrow")}
            title={t("whatsNew.title")}
            description={
              <span className={cn(unread > 0 && "font-medium text-foreground")}>{answer}</span>
            }
            className={wide ? "mb-2" : undefined}
          />
          {wide ? (
            <div className="grid grid-cols-[15rem_minmax(0,1fr)] gap-10">
              <aside className="sticky top-0 self-start pt-4">
                <WhatsNewSide
                  kind={view.kind}
                  onKind={view.setKind}
                  counts={timeline.counts}
                  isAdmin={view.isAdmin}
                  query={view.query}
                  onQuery={view.setQuery}
                  inputRef={searchRef}
                  months={timeline.months}
                  currentMonth={currentMonth}
                  onMonth={jumpMonth}
                />
              </aside>
              <div className="min-w-0 max-w-[52rem] pt-4 [--day-top:1rem]">
                {liveStatus}
                {list}
              </div>
            </div>
          ) : (
            <>
              <WhatsNewToolbar
                kind={view.kind}
                onKind={view.setKind}
                counts={timeline.counts}
                isAdmin={view.isAdmin}
                phone={phone}
                query={view.query}
                onQuery={view.setQuery}
              />
              {liveStatus}
              {list}
            </>
          )}
        </div>
      </PageShell>
      {/* Bekçi kaydırıcının en sonunda: yalnız sayfanın dibine inilince görünür (ay dizini izleyicisi). */}
      {wide ? <div ref={watchEnd} aria-hidden="true" className="h-px shrink-0" /> : null}
    </div>
  )
}
