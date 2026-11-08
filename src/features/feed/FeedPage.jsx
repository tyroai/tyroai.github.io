import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react"
import { PageShell } from "@/components/layout/PageShell"
import { SectionHeading } from "@/components/common/SectionHeading"
import { useMsal } from "@azure/msal-react"
import { useFeedPosts, useImportantMail, useMailById } from "@/features/feed/hooks/useFeedPosts"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { ETHICS_LINE } from "@/features/feed/lib/ethicsLine"
import { mergeTimeline, searchPosts } from "@/lib/feed"
import { FEED, FEED_SOURCES } from "@/lib/feedPolicy"
import { writeFeedSeen } from "@/lib/feedSeen"
import { STATUS, requestGraphScopes } from "@/lib/graph"
import { cn } from "@/lib/utils"
import { Tour } from "@/components/tour/Tour"
import { EthicsHotline } from "./EthicsHotline"
import { FeedDocs } from "./FeedDocs"
import { FilesSkeleton } from "./files/FilesStates"
import { FILES_PAGE } from "@/lib/filesPolicy"
import { lastQuery } from "@/lib/filesNav"
import { FeedHeader } from "./FeedHeader"
import { useFeedRefresh } from "./useFeedRefresh"
import { PERSONAL, SECTION_HEADING } from "./feedSections"
import { useFeedNav } from "./useFeedNav"
import { useFeedHidden } from "./useFeedHidden"
import { FeedTimeline } from "./timeline/FeedTimeline"
import { FeedPostDialog } from "./FeedPostDialog"
import { FeedTrends } from "./rail/FeedTrends"
import { isHiddenPost } from "./rail/railModel"
import { FeedLayoutContext, useSocialLayout } from "./feedLayout"
import { useFeedCongrats } from "./useFeedCongrats"
import { BackToTop } from "./mobile/BackToTop"
import { FeedStories } from "./mobile/FeedStories"
import { PullToRefresh } from "./mobile/PullToRefresh"
import { TrendsSheet } from "./mobile/TrendsSheet"
import { ForYouSkeleton } from "./foryou/ForYouSkeleton"
import { useAgendaHold } from "./hooks/useAgendaHold"

/**
 * Bul (dosyalar, kişiler, ofisler) AYRI PARÇADA (§12.13): sekmeyi hiç açmayan herkese arama,
 * gezinme ve süzgeç katmanını indirtmemek için. `FILES_PAGE.enabled = false`
 * eski `FeedDocs` bento'sunu çizer — kabul edilene kadar geri dönüş yolu.
 */
const PHOTO = { size: 120 }

const FeedFind = lazy(() => import("./find/FeedFind").then((m) => ({ default: m.FeedFind })))
/**
 * Sana özel panosu da ayrı parçada: zarflı maskotun çizicisi ve panonun kendisi yalnız sekme
 * açılınca insin. İskeleti statik (`Suspense` yedeği) ve maskotu içe almıyor.
 */
const ForYouPanel = lazy(() =>
  import("./foryou/ForYouPanel").then((m) => ({ default: m.ForYouPanel })),
)

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  GÜNDEM AKIŞI — şirketin zaman akışı
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Dört kurumsal posta kutusundan (Haberler · Duyuru · İK · Eğitim) gelen
 * duyurular tek bir akışta, en yeniden eskiye. Politika `lib/feedPolicy.js`te,
 * sorgu `lib/feed.js`te, çekme `features/feed/hooks/useFeedPosts.js`te.
 *
 * ── DÜZEN: KAPSAYICI SORGUSU, GÖRÜNTÜ ALANI DEĞİL ──────────────────────
 * Sohbet rıhtımı `<main>`ın KARDEŞİ ve sayfayı 340px'e kadar daraltabiliyor.
 * `lg:grid-cols-2` yazmak, rıhtım açıkken hâlâ geniş ekrandayız sanıp iki
 * kolonu 170px'e sıkıştırmak olurdu. Bütün kırılımlar `@container/feed`
 * üzerinden — Profil ve Güvenlik sayfalarının ölçüp yazdığı aynı tuzak.
 *
 * ── SÜZGEÇ İKİ YERDE DEĞİL, BİR YERDE ──────────────────────────────────
 * Etiket süzgeci DAR ekranda başlıktaki çip satırı, GENİŞ ekranda sağ raydaki
 * "Keşfet" listesi. İkisi aynı anda çizilmiyor: aynı kontrolü iki kez
 * göstermek "hangisi asıl?" sorusunu doğurur. Rayın listesi ayrıca SAYI
 * taşıyor (çipler taşımıyor), yani geniş ekranda daha zengin olan kazanıyor.
 *
 * ── KAYDIRMA ───────────────────────────────────────────────────────────
 * `<main>` `overflow-hidden`; sayfa KENDİ kaydırıcısını kuruyor. Sağ rayın
 * `sticky`si ancak bu kabın içinde çalışıyor.
 */

export function FeedPage() {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const nav = useFeedNav()
  const { params, section, tag, personalOnly, fromAddress, openId, congratsLink } = nav
  const { setTag, setFrom, setOpen, setSection } = nav
  const [query, setQuery] = useState("")
  const [trendsOpen, setTrendsOpen] = useState(false)
  /**
   * "Şimdi" — DAKİKADA BİR tazelenen bir durum, render'da okunan bir saat
   * DEĞİL.
   *
   * ⚠️ İki iş yapıyor. (1) `deriveHighlights` pencereyi (son 45 / 14 gün)
   * buna göre hesaplıyor; varsayılanı `Date.now()` olsaydı render SAF
   * OLMAZDI — bu depoda `Date.now()` render'da yasak (`react-hooks/purity`)
   * ve EdgeNotch aynı çözümü taşıyor. (2) Kartlara pals veriyor: `formatAgo`
   * içeride saate bakıyor ve yeniden çizim olmadan "2 saat önce" bir saat
   * sonra hâlâ "2 saat önce" yazardı. Uzun açık kalan bir akışta bu görünür
   * bir yalan; dakikada bir çizim onun bedeli.
   */
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Sağ ray yalnız Popüler'de: Sana özel ve Bul kendi düzenini taşır, ray onları daraltırdı
  // (`kesfet-bolumler.md`). Izgara orada tek kolon, panolar tam genişlikte.
  const showRail = section === "agenda"
  const access = usePageAccess()
  // İşaretli postalar Akışım ve Sana özel açıkken sorulur (üç posta sorgusu,
  // sırayla); Dosyalarım'da hiç.
  const important = useImportantMail(section === "important" || section === "agenda")

  const {
    status,
    detail,
    posts,
    hasMore,
    loadingMore,
    loadError,
    loadMore,
    refresh,
    refreshing,
    pages,
  } = useFeedPosts(tag)
  const { onRefresh, onRefreshImportant, busyRefresh } = useFeedRefresh({
    section,
    feed: { refresh, refreshing },
    important,
  })
  /**
   * Sayfanın KENDİ kaydırıcısı — kapak görselinin ön yükleme gözlemcisine
   * KÖK olarak veriliyor.
   *
   * ⚠️ `root: null` (görüntü alanı) ile `rootMargin` bu sayfada ÇALIŞMIYOR:
   * pay yalnız KÖKÜN dikdörtgenine uygulanıyor, ara kaydırıcıların kırpması
   * ise olduğu gibi kalıyor. Yani `<main>` görüntü alanından kısaysa (rıhtım
   * açık, header var) 300px'lik ön yükleme sessizce kayboluyor ve kapak
   * ancak kart tam görününce inmeye başlıyordu.
   */
  const scrollerRef = useRef(null)
  // Kartın 40 px avatarı telefonda (3×) 48'lik fotoğrafı bulanık gösterir: 120 istenir.
  const photos = usePeoplePhotos(
    FEED_SOURCES.map((s) => s.address),
    PHOTO,
  )

  // ⚠️ Damga EN YENİ gönderiye çekiliyor, YALNIZ İLERİ gidiyor
  // (`writeFeedSeen`) ve YALNIZ SÜZGEÇSİZ görünümde yazılıyor. Süzülmüş
  // listenin en yenisi akışın en yenisi değil: bir etiket bağlantısıyla
  // gelen ilk ziyaret, damgayı hiç görülmemiş gönderilerin ARKASINA koyup
  // rozeti yanlış yakardı. Sayfayı süzgeçsiz açmak okumak sayılıyor.
  const newestIso = tag ? null : (posts[0]?.received?.toISOString() ?? null)
  useEffect(() => {
    if (newestIso) writeFeedSeen(newestIso)
  }, [newestIso])

  // Akışım = duyurular + işaretli postalar (etiket süzgeci varken yalnız duyurular: süzgeç bir
  // KANAL seçiyor, kişisel postanın kanalı yok). Yalnız sabitli posta, Özelleştir'de "Sabitlenmiş
  // postalar" kapalıysa akışta yok; bayraklı ya da önemli bir posta sabitli olsa da kalır.
  // Okunamayan sabitleme (`pinned` yok) hiçbir şey gizlemez.
  const feedHidden = useFeedHidden()
  const pinnedHidden = feedHidden.hidden.has("pinned")
  const merged = useMemo(
    () =>
      (tag || status !== STATUS.ready || important.status !== STATUS.ready
        ? posts
        : mergeTimeline(posts, important.items, { hasMore })
      ).filter(
        (p) => !pinnedHidden || !p.pinned || p.flag === "flagged" || p.importance === "high",
      ),
    [posts, important.items, important.status, status, tag, hasMore, pinnedHidden],
  )
  // İşaretliler gelene kadar iskelet (en çok 1,5 sn): sonradan tepeye girip akışı itmesinler.
  const holdAgenda = useAgendaHold({
    active: section === "agenda" && !tag,
    status,
    importantStatus: important.status,
  })
  const personalAddresses = useMemo(
    () => [...new Set(merged.filter((p) => p.personal && p.address).map((p) => p.address))],
    [merged],
  )
  const personalPhotos = usePeoplePhotos(personalAddresses, PHOTO)
  const photoFor = (address) => photos.get(address) ?? personalPhotos.get(address)
  // Özelleştir menüsünde kaldırılan türler akıştan çıkar. Trendler'den bir kanal (ya da Sana
  // özel) SEÇİLİYKEN uygulanmaz: onu açıkça istemek, gizli olsa da görmek demek.
  const visible = useMemo(
    () =>
      personalOnly
        ? merged.filter((p) => p.personal && (!fromAddress || p.address === fromAddress))
        : tag || !feedHidden.hidden.size
          ? merged
          : merged.filter((p) => !isHiddenPost(p, feedHidden.hidden)),
    [merged, tag, personalOnly, fromAddress, feedHidden.hidden],
  )
  // Sağ rayın gönderen grupları: akıştaki kişisel postalar.
  const personalPosts = useMemo(() => merged.filter((p) => p.personal), [merged])
  // Dar ekranın gönderen çipi: Trendler'den seçilen göndericinin adı postasından.
  const from = fromAddress
    ? {
        address: fromAddress,
        name: personalPosts.find((p) => p.address === fromAddress)?.author ?? fromAddress,
      }
    : null
  const shown = useMemo(() => searchPosts(visible, query), [visible, query])
  // ⚠️ Sayılar YALNIZ süzgeçsizken: bir etiket seçiliyken sunucudan zaten
  // yalnız o etiket geliyor ve öteki üçüne "0" yazmak yanlış olurdu.
  // Akışım'da GÖRÜNEN her kart sayılır: işaretli postalar `personal` satırına
  // (Trendler kutusunun "Sana özel" satırı), duyurular kanalına.
  const counts = useMemo(() => {
    if (tag) return {}
    const out = {}
    for (const p of merged) {
      const k = p.personal ? "personal" : p.tag
      out[k] = (out[k] ?? 0) + 1
    }
    return out
  }, [merged, tag])

  // ⚠️ Adreste açık kalan gönderi YÜKLENMİŞ listede olmayabilir (sayfa
  // yenilendi ve gönderi üçüncü sayfadaydı). O hâlde tek başına getiriliyor;
  // yoksa `?post=` tıklanabilir ama hiçbir şey açmayan bir adres olurdu.
  const listed =
    merged.find((p) => p.id === openId) ?? important.items?.find((p) => p.id === openId) ?? null
  // ⚠️ Yedek okuma KAYNAK KAPISIZ (`fetchMailById`): Akışım artık kişisel
  // postaları da taşıyor ve kapılı okuma (`fetchPostById`) onlar için `null`
  // dönüp pencereyi hiç açmıyordu. Kurumsal iletide de aynı alanları veriyor.
  const fetched = useMailById(
    openId,
    Boolean(openId) && !listed && important.status !== "loading" && section !== "docs",
  )
  const open = listed ?? fetched
  // Kişisel postanın göndericisi kurumsal kutulardan biri değil — fotoğrafı ayrı.
  const openPhotos = usePeoplePhotos(open && !open.tag && open.address ? [open.address] : [], PHOTO)

  async function connect() {
    const ok = await requestGraphScopes(instance, accounts[0], ["Mail.Read"])
    // İKİ liste de yeniden sorulur (bug #5): Sana özel'in "Bağlan"ı yalnız
    // duyuruları tazeliyordu, işaretli postalar izinsiz hâlde kalıyordu.
    if (ok) {
      refresh()
      important.refresh()
    }
  }

  // Trendler'deki "Sana özel" satırı: bölüme götürür, oradayken Akışım'a döner.
  const personalRow = {
    active: section === "important",
    onSelect: () => {
      setSection(section === "important" ? "agenda" : "important")
      scrollerRef.current?.scrollTo({ top: 0 })
    },
  }

  // Trendler: genişte sağ ray, darda aynı içerik bir pencerede (`TrendsSheet`).
  const trends = {
    counts,
    tag: personalOnly ? PERSONAL : tag,
    onTagChange: setTag,
    personal: personalRow,
    personalPosts,
    marked: important.items,
    activeFrom: fromAddress,
    onSelectSender: setFrom,
    photoFor,
    onOpen: setOpen,
    hidden: feedHidden.hidden,
  }

  const { celebrations, people, empty } = useFeedCongrats({ posts, now, onOpen: setOpen })
  // Telefonun üstündeki kap genişliğinde gönderiler ortalanmış kartlar, hikâyeler masaüstü kipinde.
  const layout = useSocialLayout(scrollerRef)

  return (
    /* ⚠️ **BU KABUK ETİK HATTININ ÇAPASIDIR, SÜS DEĞİL.** Hap sayfanın sağ
       alt köşesinde duruyor ve `position: fixed` ile GÖRÜNTÜ ALANINA
       bağlanamaz: sohbet rıhtımı `<main>`in kardeşi, açılınca sayfayı
       daraltıyor ama görüntü alanı aynı kalıyor — çakılı bir hap rıhtımın
       bestecisinin üstüne otururdu. Kabuk `<main>`i dolduruyor, hap ona
       `absolute` ile bağlı, yani rıhtımla birlikte sola kayıyor.
       Kaydırıcı DEĞİŞMEDİ: `@container/feed` ve bütün eşikler hâlâ
       aşağıdaki kutuda. */
    <FeedLayoutContext.Provider value={layout}>
      <div className="relative flex h-full min-h-0 w-full flex-col">
        {/* Kaydırıcı ortak kap (`PageShell`: kenar her sayfada aynı); okuma eni (`max-w-6xl`) ve kap
            sorgusu içteki sütunda — sola yaslı, başlık öteki sayfalarla aynı yerde. Üst pay başlıkta:
            başlık gizlenince (dar kap, kısa ekran) yapışkan sekmeler en üste oturur. */}
        <PageShell
          ref={scrollerRef}
          notch={false}
          className="flex h-full flex-col overflow-y-auto overflow-x-hidden pb-12 pt-0 shortest:pt-0"
          // Yapışkan başlığın altı: odakla ya da turla kaydırılan öğe başlığın altında kalmasın.
          style={{ scrollPaddingTop: "var(--feed-head, 0px)" }}
        >
          <div className="@container/feed flex w-full max-w-6xl flex-col">
            {/* ── Başlık ─────────────────────────────────────────────────────── */}
            {/* ⚠️ `notch-gutter` KAPSAYICIDA DEĞİL, İÇERİDE — ve bu ölçülmüş bir
            zorunluluk. Oluk `@container/feed`in kendi kutusuna konunca o kutu
            1104 → 1003 pikselе düşüyor, `@[64rem]` eşiği tutmuyor ve sağ ray
            TAMAMEN kayboluyordu: taşmayı önlemek için rayı silmek. İki blok da
            aynı oluğu alıyor, yoksa arama satırı ile ray birbirinden kayar. */}
            {/* Başlık SEKMELERİN ÜSTÜNDE (Self Servis ve To-Do'nun sırası): kaynağı söyleyen kaş +
            bölümün adı, sekme değişince birlikte değişir. */}
            <SectionHeading
              eyebrow={t(SECTION_HEADING[section].eyebrow)}
              title={t(SECTION_HEADING[section].title)}
              className="notch-gutter mb-4 pt-page @max-[40rem]/feed:hidden shortest:hidden"
            />
            <FeedHeader
              scrollerRef={scrollerRef}
              section={section}
              onSection={setSection}
              tag={personalOnly ? PERSONAL : tag}
              onTagChange={setTag}
              counts={counts}
              showRail={showRail}
              important={important}
              query={query}
              onQuery={setQuery}
              busyRefresh={busyRefresh}
              onRefresh={onRefresh}
              feedHidden={feedHidden}
              onTrends={() => setTrendsOpen(true)}
              from={from}
              onClearFrom={() => setTag(PERSONAL)}
            />

            {/* ── İÇERİK + RAY ──────────────────────────────────────────────
            Izgara her bölümde kabuk: sol kolon bölüme göre değişir, sağ ray yalnız
            Popüler'de (`showRail`).
            ⚠️ **KOLON AÇIKÇA YAZILIR** (`col-start-`), sıraya güvenilmez:
            gizlenen bir panel (`display:none`) ızgara öğesi olmaktan çıkıyor
            ve kalan çocuklar bir kolon SOLA kayıyordu — ray sol kolona,
            içerik sağa düşerdi. */}
            <div
              data-section={section}
              className={cn(
                "feed-grid notch-gutter mt-4 grid shrink-0 grid-cols-1 items-start gap-5 @max-[40rem]/feed:mt-2",
                showRail && "@[64rem]/feed:grid-cols-[minmax(0,1fr)_17rem]",
              )}
            >
              <div
                role="tabpanel"
                id="feed-panel-agenda"
                aria-labelledby="feed-sec-agenda"
                hidden={section !== "agenda"}
                className={cn(
                  "flex min-w-0 flex-col gap-3 @[64rem]/feed:col-start-1",
                  layout.social && "mx-auto w-full max-w-2xl gap-4",
                  section !== "agenda" && "hidden",
                )}
              >
                {/* Tebrik şeridi: telefonda süzgeçsiz ve aramasızken; masaüstünde (kişiler rayda değil
                şeritte) arama dışında hep. */}
                {(layout.social ? !query.trim() : !tag && !personalOnly && !query.trim()) && (
                  <div>
                    <FeedStories
                      celebrations={celebrations}
                      posts={posts}
                      now={now}
                      onOpen={setOpen}
                      people={people}
                      empty={empty}
                      initialOpen={congratsLink}
                    />
                  </div>
                )}
                <FeedTimeline
                  status={status}
                  posts={shown}
                  total={merged.length}
                  hold={holdAgenda}
                  importantLoading={important.status === "loading"}
                  photoFor={photoFor}
                  now={now}
                  scrollerRef={scrollerRef}
                  onOpen={setOpen}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                  loadError={loadError}
                  detail={detail}
                  loadMore={loadMore}
                  pages={pages}
                  maxPages={FEED.maxPages}
                  onConnect={connect}
                  onRefresh={onRefresh}
                />
              </div>

              {/* ── SANA ÖZEL — aynı SOL kolonda, yalnız açıkken mount ────────
              ⚠️ DOM'da RAYIN ÖNÜNDE: sekme sırası pano → ray olsun (N1); eskiden
              ray, panonun "Sıradaki"sinden önce odak alıyordu. Satır yerleşimi
              açık (`row-start-1`), sıraya güvenilmiyor. */}
              {section === "important" && (
                <div
                  role="tabpanel"
                  id="feed-panel-important"
                  aria-labelledby="feed-sec-important"
                  className="min-w-0 @[64rem]/feed:col-start-1 @[64rem]/feed:row-start-1"
                >
                  <Suspense fallback={<ForYouSkeleton now={now} />}>
                    <ForYouPanel
                      state={important}
                      query={query}
                      now={now}
                      onOpen={setOpen}
                      onConnect={connect}
                      onRetry={onRefreshImportant}
                      onClearQuery={() => setQuery("")}
                      todoOpen={access.todo}
                    />
                  </Suspense>
                </div>
              )}

              {/* Sağ ray — yalnız geniş KAPSAYICIDA ve yalnız Popüler'de (`showRail`);
              `sticky` bu sayfanın kendi kaydırıcısına göre çalışıyor. */}
              {showRail && (
                <aside
                  data-tour="feed-trends"
                  className="hidden flex-col gap-3 @[64rem]/feed:sticky @[64rem]/feed:top-[calc(var(--feed-head,0px)-0.5rem)] @[64rem]/feed:col-start-2 @[64rem]/feed:row-start-1 @[64rem]/feed:flex @[64rem]/feed:max-h-[calc(100dvh-var(--feed-head,0px)-7rem)] @[64rem]/feed:overflow-y-auto @[64rem]/feed:[scrollbar-width:thin] [&>*]:shrink-0"
                >
                  <FeedTrends {...trends} />
                  {!layout.social && people}
                </aside>
              )}

              {/* ── DOKÜMANLAR — aynı SOL kolonda ─────────────────────────────
              ⚠️ GİZLENMİYOR, MOUNT EDİLMİYOR — Gündem'in aksine. Taşıdığı
              tek durum açık klasör; onu korumanın karşılığı, hiç bakılmayan
              sekmenin 14 görselini peşin indirmek olurdu. */}
              {section === "docs" && (
                <div
                  role="tabpanel"
                  id="feed-panel-docs"
                  aria-labelledby="feed-sec-docs"
                  className="min-w-0 @[64rem]/feed:col-start-1 @[64rem]/feed:row-start-1"
                >
                  {FILES_PAGE.enabled ? (
                    <Suspense
                      fallback={
                        // Parça inerken panonun KENDİ iskeleti: açılışta klasör çipleri + son
                        // dosyalar, bir yerdeyken ya da süzgeçliyken satırlar.
                        <FilesSkeleton
                          home={
                            !["floc", "fsrc", "ft", "fd", "fp"].some((k) => params.has(k)) &&
                            lastQuery().trim().length < FILES_PAGE.minQuery
                          }
                        />
                      }
                    >
                      <FeedFind scrollerRef={scrollerRef} now={now} />
                    </Suspense>
                  ) : (
                    <FeedDocs />
                  )}
                </div>
              )}
            </div>

            <FeedPostDialog
              post={open}
              photoFor={(p) => photos.get(p.address) ?? openPhotos.get(p.address)}
              open={Boolean(open)}
              onOpenChange={(next) => !next && setOpen(null)}
              // Önceki/sonraki yalnız Popüler'in sırasında; gezinme geçmişe kayıt eklemez.
              list={section === "agenda" ? shown : null}
              onNavigate={(id) => setOpen(id, true)}
            />
            {showRail && (
              <TrendsSheet
                open={trendsOpen}
                onOpenChange={setTrendsOpen}
                social={layout.social}
                trends={trends}
              />
            )}
          </div>
        </PageShell>

        {/* Dokunmatikte aşağı çekip yenile ve uzun akışta "Başa dön" (Dosyalarım'ın kendi yenilemesi var). */}
        {section !== "docs" && (
          <PullToRefresh scrollerRef={scrollerRef} onRefresh={onRefresh} busy={busyRefresh} />
        )}
        <BackToTop scrollerRef={scrollerRef} />

        {/* ETİK HATTI — geri almak tek satır: `ETHICS_LINE.enabled = false`.
          Alt kenar payı `env(safe-area-inset-bottom)` ile TABANLI: kurulu
          PWA'da telefonun ev çubuğu bu köşeye düşüyor. Yer ve boy `Fab` ile aynı
          (`feedMobile.css` › `.feed-fab-dock`). */}
        {ETHICS_LINE.enabled && (
          <div className="feed-fab-dock">
            <EthicsHotline />
          </div>
        )}
        {/* İlk ziyarette kısa tur — Popüler'in gönderileri gelince. */}
        <Tour id="feed" page when={section === "agenda" && status === STATUS.ready} />
      </div>
    </FeedLayoutContext.Provider>
  )
}
