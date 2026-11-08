import "@/lib/i18n/tour"
import { useMemo, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { useMailMessages } from "@/hooks/useMailMessages"
import { useFeedFresh } from "@/hooks/useFeedUnread"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useFocusTasks } from "@/hooks/useFocusTasks"
import { useMyCelebration } from "@/hooks/useMyCelebration"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { useWeather } from "@/hooks/useWeather"
import { useIntroOnce } from "@/features/myspace/hooks/useIntroOnce"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { previewCelebration, sceneFor } from "@/lib/myCelebration"
import { cn } from "@/lib/utils"
import { OverlayScrollbar } from "@/components/common/OverlayScrollbar"
import { PageShell } from "@/components/layout/PageShell"
import { useBoardCalendar, useMeetingLoad } from "@/features/widgets/useBoardCalendar"
import { useBoardBriefCta } from "@/features/widgets/useBoardData"
import { WeatherGreeting } from "./WeatherPill"
import { AppsSection } from "./AppsSection"
import { AskBox } from "./AskBox"
import { BriefBubble } from "./BriefBubble"
import { FocusCard } from "./FocusCard"
import { HelpOrbCard } from "./HelpOrbCard"
import { HomeBoard } from "./HomeBoard"
import { HomeEditFab } from "./HomeEditFab"
import { HomeGreeting } from "./HomeGreeting"
import { Tour } from "@/components/tour/Tour"
import { useBoardEditing } from "@/lib/boardEdit"
import { MeetingRhythmCard } from "./MeetingRhythmCard"
import { NextMeetingCard } from "./NextMeetingCard"
import { useMinuteNow } from "./useMinuteNow"
import { useWelcome } from "./welcome/useWelcome"
import { WelcomeLazy } from "./welcome/WelcomeLazy"
import { useWideBoard } from "./useWideBoard"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Anasayfa (`/myspace`) — kişinin çalışma alanı
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **KAPI BU DOSYADA DEĞİL, ROTADA** (`App.jsx` › `access.myspace`,
 * kural `lib/pageAccess.js`). Kapıda kalan kişiye bu parça hiç inmiyor.
 *
 * ⚠️ **GÖRÜNÜR SAYFA BAŞLIĞI YOK.** Sayfanın adı sidebar'da ve header'da zaten
 * yazıyor; karşılama bloğu sayfanın gerçek başı. Başlık `sr-only` bir `<h1>`
 * olarak YERİNDE — ekran okuyucu ve belge ana hatları için (Keşfet'in aynı
 * kararı).
 *
 * ── DÜZEN: REFERANSIN ÖLÇÜLERİ (referans pano, 1300px çerçeve) ─────────
 *
 * | referans | burada |
 * |---|---|
 * | çerçeve dolgusu 50px, içerik üstte ~105px'ten | `lg:px-12` · `lg:pt-14` (başlık çubuğunun altından) |
 * | sol kolon %40 · sağ %60 | `0.74fr / 1.26fr` · `gap-x-12` |
 * | sağda 3 sütun, 14px aralık, kart 28px köşe · 20px dolgu | `grid-cols-3` · `gap-4` · `rounded-[1.75rem]` · `p-5` |
 * | gri tuval, beyaz kart | beyaz zemin · kartı `.ms-surface` ayırıyor (saç teli kenarlık + iki katmanlı gölge) |
 *
 * Kartların karşılıkları ve düzenin geçmişi `docs/features/anasayfa-kartlar.md`de.
 *
 * ⚠️ **KUTU `max-w-[96rem]`.** Daha dar bir tavan (`max-w-6xl`) geniş ekranda
 * içeriği ortaya iter: 1728px'te sidebar ile ilk öğe arasında ~180px boş
 * kalırdı. Geniş kutuda ray içeriğin üstüne binmesin diye bu sayfa kendi
 * oluğunu taşıyor: `.myspace-gutter`, çentik varken HER genişlikte.
 *
 * ⚠️ **DÜZEN GÖRÜNTÜ ALANIYLA DEĞİL KAPSAYICIYLA.** Sohbet rıhtımı `<main>`in
 * kardeşi ve sayfayı daraltıyor; `lg:` o hâlde hâlâ "geniş" sanıp iki kolonu
 * ezerdi (Keşfet'in kuralı). Kapsayıcı OLUĞUN İÇİNDE: karar gerçekten
 * kullanılabilen genişliğe göre verilsin.
 */
export function MySpacePage({ onOpenChat, onNewChat }) {
  const { t } = useLocale()
  const me = useMe()
  // Kartların giriş dizisi yükleme başına bir kez: geri dönüşte yeniden oynamaz.
  const intro = useIntroOnce("home-grid")
  const editing = useBoardEditing()
  // Keşfet'in KENDİ kapısı: iki sayfanın kitlesi bugün aynı ama ayrı
  // şalterler — biri herkese açıldığında öteki kapalı kalabilir ve o hâlde
  // buradaki sayı ve bağlantı, açılamayan bir sayfayı vaat ederdi.
  const pageAccess = usePageAccess()
  const feedOpen = pageAccess.feed

  // ── SENİN GÜNÜN — kişinin kendi doğum günü / iş yıl dönümü: tebrik sayfanın
  // SELAMLAMASINDA, hava kartının ön yüzü o güne ait, özet balonunun başında AYRI
  // bir teşekkür bloğu ve yardım kartında kutlama sahnesi. Kaynak ve kurallar `lib/myCelebration.js`te.
  // ⚠️ ÖNİZLEME `?celebrate=birthday|anniversary|both` YALNIZ DEV'de ya da
  // yönetici grubunda (kesin `=== true`): tasarımı kendi gününü beklemeden
  // görmek için; başkasına bir "senin günün" göstermez.
  const realCelebration = useMyCelebration()
  const [params, setParams] = useSearchParams()
  // Telefonda oturumun ilk ziyaretinde yukarıdan inen karşılama (`welcome/`); tur onu bekler.
  const welcome = useWelcome(params)
  const inAdminGroup = useIsInGroup(ADMIN_GROUP_ID) === true
  const canPreview = import.meta.env.DEV || inAdminGroup
  const previewKey = canPreview ? params.get("celebrate") : null
  const preview = useMemo(() => previewCelebration(previewKey), [previewKey])
  const celebration = preview ?? realCelebration
  const scene = useMemo(() => sceneFor(celebration), [celebration])
  // Hava kartı: VARLIĞI panonun satır düzenini değiştiriyor (aşağıda, karşılama
  // kolonu), sayfa bu yüzden kancayı kendisi çağırıyor. ⚠️ Kutlama günü DE
  // çizilir; ön yüzü o güne ait (`WeatherGreeting` › `celebration`).
  const weather = useWeather()
  // Hava alınamasa da kart durur (`SkyUnavailable`); yalnız kapalıyken yok.
  const skyCard = weather.status !== "off"

  // "Şimdi" state'te ve dakika sınırında ilerliyor: render içinde `Date.now()`
  // saf değil ve bir kez dondurmak kalan toplantı sayısını bayatlatırdı.
  const now = useMinuteNow()

  // ⚠️ Aralık ve kişi listesi ÇENTİKLE BİREBİR AYNI — önbellek anahtarı ortak,
  // yani bu sayfa takvim için Graph'a İKİNCİ kez gitmiyor.
  const { cal, rangeStart, rangeEnd } = useBoardCalendar()
  // Header ve çentikle AYNI anahtar (`12`).
  const mail = useMailMessages(12)
  // Sidebar rozetinin AYNI sorgusu: sayı + en yeni üç duyuru (özetin ipucu).
  const feedFresh = useFeedFresh()
  // Bugünün odağı: Microsoft To Do varsa o, yoksa bu tarayıcı (`useFocusTasks`).
  const focus = useFocusTasks()

  // Özetin sorulacağı asistan = sohbetin AÇACAĞI asistan (dashboard'un kuralı).
  const briefCta = useBoardBriefCta()

  const load = useMeetingLoad(cal.events, now, rangeStart, rangeEnd)

  const helpRef = useRef(null)

  const firstName = (me.name || "").split(" ")[0]
  // Kendi kaydırma çubuğumuz bu kaydırıcıyı izliyor (`OverlayScrollbar`).
  const scrollRef = useRef(null)

  /*
   * ⚠️ ÖZET BALONU SAĞ IZGARANIN İLK KARTI — iki kolonlu düzende ve hava kartı
   * varken: sol kolonun ilk satırı yalnız kart, sağın ilk satırı balon ·
   * sıradaki toplantı · bugünün odağı. Balon solda kalsa ikinci satırı uzatır,
   * sağdaki ritim kartını boşlukla gererdi. Tek kolonda (telefon, rıhtım açık)
   * balon kartın HEMEN ALTINDA — selamlama · günün özeti · soru sırası bir
   * konuşma. Kart yoksa (hava okunamadı) balon solda, kartın yerinde.
   * Balon iki ayrı ağaç dalında duruyor ve CSS bir öğeyi bir ebeveynden
   * ötekine taşıyamaz; iki kopya çizmek ise iki DaySummary, iki küre demekti.
   * Düzen kararı `useWideBoard`da.
   */
  const boardRef = useRef(null)
  const welcomeRef = useRef(null)
  const wideBoard = useWideBoard(boardRef, welcomeRef)
  const bubbleInGrid = skyCard && wideBoard

  // Özet balonu: geniş panoda sağ ızgaranın ilk kartı; darda kartın yanında
  // (≥ 34rem) ya da altında; kart yoksa selamlamanın altında.
  const briefBubble = (className, compact = false) => (
    <BriefBubble
      className={className}
      compact={compact}
      celebration={celebration}
      cal={cal}
      mail={mail}
      now={now}
      focus={focus}
      feedFresh={feedFresh}
      feedOpen={feedOpen}
      todoOpen={pageAccess.todo}
    />
  )

  return (
    // ⚠️ Sarmalayıcı `relative` ve KAYMIYOR: çubuk kaydırıcının kardeşi, yoksa
    // içerikle birlikte kayıp giderdi. Yerli çubuk `ms-scroll` ile gizli
    // (yalnız ince işaretçide) — gerekçe `OverlayScrollbar`da: tam boy koşup
    // çentiğin arkasından geçerdi.
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        data-myspace-scroll
        className="ms-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        {/* Düzenleme düğmesi varken alt pay büyür: kaydırmanın sonunda alt bilgi düğmenin altında kalmaz. */}
        <PageShell className={pageAccess.homeEdit ? "pb-28" : "pb-16"}>
          <div ref={boardRef} className="@container/myspace">
            {/* Görünür başlık YOK (gerekçe dosya başında); belgenin ana başlığı
                ekran okuyucu için yerinde. */}
            <h1 className="sr-only">{t("nav.myspace")}</h1>

            {/* ── Selamlama + günün okuması: iki düzende de widget'ların üstünde. */}
            <HomeGreeting
              firstName={firstName}
              celebration={celebration}
              cal={cal}
              focus={focus}
              now={now}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
            />

            {/* ── Pano: karşılama + ızgara. Kitlesi içindeysen (`HOME_EDIT`) aynı kartlar
                düzenlenebilir widget'lar olarak (`HomeBoard`); değilse bugünkü sabit düzen. */}
            {pageAccess.homeEdit ? (
              <HomeBoard
                env={{
                  weather,
                  now,
                  firstName,
                  celebration,
                  ctx: { cal, mail, focus, feedFresh, now, pageAccess },
                  briefCta,
                  onNewChat,
                  load,
                  helpRef,
                  scene,
                  greeted: true,
                }}
              />
            ) : (
              <div className="grid gap-6 @[34rem]/myspace:gap-10 @[60rem]/myspace:grid-cols-[minmax(0,0.74fr)_minmax(0,1.26fr)] @[60rem]/myspace:gap-x-12 @[60rem]/myspace:gap-y-4">
                <section
                  ref={welcomeRef}
                  aria-label={t("myspace.welcomeAria")}
                  className="flex min-w-0 flex-col @[60rem]/myspace:row-span-2 @[60rem]/myspace:grid @[60rem]/myspace:grid-rows-subgrid"
                >
                  {/* ⚠️ İKİ GRUP, ORTAK SATIRLAR. İki kolonlu düzende karşılama
                      kolonu ve sağ ızgara AYNI iki satırı paylaşıyor
                      (`grid-rows-subgrid`): 1. satır gök + özet balonu ↔ toplantı +
                      odak, 2. satır soru kutusu + hazır istemler ↔ ritim + küre.
                      Satırın boyu iki tarafın uzununda; kısa kalan taraf uzar —
                      solda balon ve hazır istem ızgarası (`flex-1`, kutucuk
                      satırları eşit `auto-rows-fr`), sağda kartlar (ızgaranın
                      `stretch`i). Tek kolonda gruplar sıradan blok.
                      ⚠️ `@container/hero` GRUPLARDA, bölümde DEĞİL: kapsayıcı olan
                      bir eleman alt ızgara OLAMIYOR (`container-type` sınırlaması —
                      `grid-template-rows: subgrid` sessizce `none` hesaplanıyor,
                      ölçüldü). İki grup bölümle aynı genişlikte, yani `cqi` ve
                      `@[34rem]/hero` eşikleri bölümünkiyle aynı. */}
                  <div
                    data-tour="welcome"
                    className={cn(
                      "@container/hero flex min-w-0 flex-col",
                      // Dar panoda kart ve özet balonu yan yana (≥ 34rem — sağ
                      // ızgaranın iki sütuna geçtiği eşik), daha darda alt alta.
                      skyCard && !bubbleInGrid && "grid gap-4 @[34rem]/myspace:grid-cols-2",
                    )}
                  >
                    {/* Hava kartı: başında havanın tek cümlesi (selamlama sayfanın
                        başında, `HomeGreeting`); gerekçeler `WeatherPill.jsx` ile
                        `weather/`da. Hava kapalıyken kart yok, özet balonu başta. */}
                    <WeatherGreeting
                      w={weather}
                      celebration={celebration}
                      className="@[60rem]/myspace:flex-1"
                    />

                    {skyCard
                      ? !bubbleInGrid && briefBubble()
                      : briefBubble("@[60rem]/myspace:flex-1")}
                  </div>
                  <div data-tour="ask" className="@container/hero flex min-w-0 flex-col">
                    <AskBox briefCta={briefCta} onNewChat={onNewChat} />
                  </div>
                </section>

                {/* ⚠️ Sıra DOM'da referansınki: üst sırada üç küçük kart, altta iki
                    sütunluk ritim + küre. İki sütunlu ızgarada (34–46rem — rıhtım
                    açık, tablet) ritim TEK sütun ve küreyle aynı satırda: küre
                    kartı aşağıda tek başına kalmasın.
                    ⚠️ İki kolonlu düzende (@60rem) ızgara HER ZAMAN üç sütunlu
                    (@46rem eşiği altında kalamıyor), yani tam iki satır: alt
                    ızgaranın satırları panonunkiler (`grid-rows-subgrid`) —
                    gerekçe karşılama kolonunda. */}
                <div
                  className={cn(
                    intro && "ms-stagger",
                    "grid min-w-0 grid-flow-row-dense content-start gap-4 @[34rem]/myspace:grid-cols-2 @[46rem]/myspace:grid-cols-3 @[60rem]/myspace:row-span-2 @[60rem]/myspace:grid-rows-subgrid",
                  )}
                >
                  {bubbleInGrid && briefBubble(undefined, true)}
                  <NextMeetingCard
                    cal={cal}
                    now={now}
                    className="@[34rem]/myspace:min-h-[12.5rem]"
                  />
                  {/* Balon ızgaradayken odak tek sütun (satırda üç kart); değilken
                      üç sütunda iki sütun genişliğinde. */}
                  <FocusCard
                    focus={focus}
                    canOpenTodo={pageAccess.todo}
                    className={cn(
                      "@[34rem]/myspace:min-h-[12.5rem]",
                      !bubbleInGrid && "@[46rem]/myspace:col-span-2",
                    )}
                  />
                  <MeetingRhythmCard
                    cal={cal}
                    load={load}
                    now={now}
                    className="@[34rem]/myspace:min-h-[15rem] @[46rem]/myspace:col-span-2 @[60rem]/myspace:self-start"
                  />
                  <HelpOrbCard
                    anchorRef={helpRef}
                    scene={scene}
                    ctx={{ cal, mail, focus, feedFresh, now, pageAccess }}
                    className="@[60rem]/myspace:self-start"
                  />
                </div>
              </div>
            )}

            {/* ── Ayraç: çalışma alanı · uygulamalar ───────────────────── */}
            <div aria-hidden="true" className="mt-8 @[34rem]/myspace:mt-12 lg:mt-14" />

            <AppsSection
              onOpenChat={onOpenChat}
              feedOpen={feedOpen}
              className="mt-6 @[34rem]/myspace:mt-10 lg:mt-12"
            />

            <footer className="mt-10 @[34rem]/myspace:mt-16 flex flex-wrap items-center justify-between gap-2 text-[0.6875rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="text-brand">
                  ✦
                </span>
                {t("myspace.footer")}
              </span>
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                {/* Sayfanın turunu yeniden açar (`components/tour` › `?tour=1`). */}
                <button
                  type="button"
                  onClick={() =>
                    setParams((p) => {
                      const next = new URLSearchParams(p)
                      next.set("tour", "1")
                      return next
                    })
                  }
                  className="rounded underline-offset-2 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  {t("tour.replay")}
                </button>
                {/* Sayfanın adı SÖZLÜKTEN; "tyro" wordmark, çevrilmez. */}
                <span>
                  {t("nav.myspace")} ·{" "}
                  <strong className="font-semibold text-foreground/80">tyro</strong>
                </span>
              </span>
            </footer>
          </div>
        </PageShell>
      </div>
      <OverlayScrollbar targetRef={scrollRef} avoidNotch />
      {/* Anasayfa'yı düzenle: sağ altta cam düğme (header'da değil). */}
      {pageAccess.homeEdit && <HomeEditFab />}
      {welcome.open && (
        <WelcomeLazy
          onClose={welcome.close}
          onNewChat={onNewChat}
          firstName={firstName}
          celebration={celebration}
          weather={weather}
          cal={cal}
          now={now}
        />
      )}
      <Tour id="home" page when={!welcome.open} />
      {/* Düzenleme kipi ilk kez açılınca kısa tur. */}
      <Tour id="home-edit" when={editing} />
    </div>
  )
}
