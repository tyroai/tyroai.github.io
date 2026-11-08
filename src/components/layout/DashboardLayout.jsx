import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./Sidebar"
import { ChatDock } from "./ChatDock"
import { PageDockColumn } from "./PageDock"
import { PageDockContext, usePageDockState } from "./pageDockState"
import { Header } from "./Header"
import { CommandPalette } from "@/components/common/CommandPalette"
import { WarmStart } from "@/features/chat/WarmStart"
import { primeCelebrations } from "@/hooks/useCelebrations"
import { EdgeNotch } from "./EdgeNotch"
import { EdgeNotchFrame } from "./EdgeNotchFrame"
import { MobileNotch } from "./MobileNotch"
import { SessionExpiredBanner } from "./SessionExpiredBanner"
import { useNotchEdge } from "./useNotchEdge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { usePwaInstall } from "@/hooks/usePwaInstall"
import { edgeNotchScope } from "@/lib/edgeNotchState"
import { NO_NOTCH_PAGE_IDS } from "@/lib/navGroups"

// Yenilikler penceresi TEMBEL: `changelog.js` yalnız büyüyor ve doğrudan
// import etmek onu giriş paketine çivilerdi. Pencere zaten çoğu açılışta
// hiçbir şey çizmiyor.
const WhatsNewDialog = lazy(() =>
  import("@/features/changelog/WhatsNewDialog").then((m) => ({ default: m.WhatsNewDialog })),
)
// Yalnız iPhone/iPad Safari'de iner: kurulum tarifi (menü ve Anasayfa kartı açar).
const IosInstallGuide = lazy(() => import("@/components/common/IosInstallGuide"))
import { useHotkey } from "@/hooks/useHotkey"
import { cn } from "@/lib/utils"

export function DashboardLayout({
  children,
  activeId,
  onActiveIdChange,
  onNewChat,
  // Favori bir agent'a tıklandığında sohbeti onunla açar. URL şeklini tek
  // yerde (App.jsx) tutmak için prop olarak iniyor.
  onOpenChatWithAgent,
  // The chat element, rendered here rather than among the routes so that it
  // keeps ONE parent across page / dock / hidden — see ChatDock and
  // PersistentChat.
  chatSlot,
  chatMode = "hidden",
  onCloseDock,
  onExpandChatToPage,
  onToggleDock,
}) {
  const navigate = useNavigate()
  const pwa = usePwaInstall()
  const dock = usePageDockState()
  const dockValue = useMemo(
    () => ({ target: dock.target, setOwner: dock.setOwner }),
    [dock.target, dock.setOwner],
  )
  // Kenar tek panel taşır: sohbet ile sayfa paneli (ör. Güvenlik'te kullanıcı) aynı anda açık
  // olmaz — ikisi birden listeyi ezerdi. Son açılan kazanır.
  const prevDock = useRef({ owner: null, chat: chatMode })
  useEffect(() => {
    const was = prevDock.current
    const panelOpened = dock.owner && dock.owner !== was.owner
    const chatOpened = chatMode === "dock" && was.chat !== "dock"
    if (panelOpened && chatMode === "dock") onCloseDock?.()
    else if (chatOpened && dock.owner) dock.owner.close()
    prevDock.current = { owner: dock.owner, chat: chatMode }
  }, [dock.owner, chatMode, onCloseDock])
  const [searchOpen, setSearchOpen] = useState(false)
  useHotkey("mod+k", () => setSearchOpen((v) => !v))

  /**
   * Tebrikler listesini KABUK mount olurken ısıt.
   *
   * ⚠️ **SEBEP ÖLÇÜLDÜ** (2026-09-22, canlı): İK sanal entity'si 530 satırı
   * ~12 saniyede, ilk (soğuk) koşuda ~171 saniyede döndürüyor — maliyet
   * satır sayısına bağlı, aynı filtreyle 5 satır ~1,8 sn. Sayfa mount
   * olduğunda başlatılınca kullanıcı o 12 saniyeyi EKRANA BAKARAK
   * bekliyordu. Burada başlayınca bekleme, kullanıcının sayfaya gelene
   * kadar geçirdiği süreyle örtüşüyor.
   *
   * ⚠️ Bu bir HIZLANDIRMA DEĞİL, beklemenin yerini değiştirmek. Kalıcı çözüm
   * veriyi gece bir kez kopyalamaktır; o gelene kadar geçerli.
   *
   * ⚠️ Sekme başına TEK istek (modül önbelleği) ve yetkisi olmayanda hızlı
   * düşüyor — hata sessiz, ekranda bir şey değişmiyor.
   */
  useEffect(() => {
    primeCelebrations()
  }, [])

  /* ÇENTİK HER SAYFADA, HER DURUMDA. Kenarda bir panel (sohbet ya da sayfa paneli) açıkken
     gizlenmez, panelin soluna — ana sütunun kenarına — taşınır (`useNotchEdge`): header panel
     açılınca değişmez, posta, takvim ve dünya saati çentikte kalır. Üç tüketici: çentiğin
     kendisi, header (çentik varken posta / takvim / dünya saati düğmeleri yok) ve `<main>`in
     `data-notch`ı — sayfa sağ kenardaki 90px'lik rayın altına girmesin diye oluk açar: geniş
     sayfa `.myspace-gutter` / `.notch-gutter`, ortalı dar sayfa `.notch-fit` (edge-notch.css).
     Yeni bir sayfa bunlardan birini taşımalı. Keşfet'in sağ rayı çentiğin tam yerinde:
     oluğu `data-notch` ile açılıyor. */
  const wideNotch = useMediaQuery("(min-width: 1024px)")
  // Kullanıcı menüsünün sayfalarında (Profil, Güvenlik, Yardım, Yenilikler) çentik yok.
  const notch = !NO_NOTCH_PAGE_IDS.includes(activeId)
  const mainRef = useRef(null)
  useNotchEdge(mainRef)
  // Sayfanın yanında bir sütun açık mı (sohbet sayfasında sayfa paneli gizli): ana sütun daralır,
  // oluk her genişlikte gerekir (`data-docked`, edge-notch.css).
  const docked = chatMode === "dock" || (Boolean(dock.owner) && chatMode !== "page")

  return (
    <SidebarProvider
      // h-[100dvh] + overflow-hidden caps the whole dashboard at the
      // viewport — without an UPPER bound at the top of the flex chain,
      // every `min-h-0` further down is toothless because the parent has
      // no defined height to constrain children against. The shadcn
      // primitive only sets `min-h-svh` (LOWER bound), so chat thread
      // content was growing the whole page and scrolling the body.
      // pwa:h-screen overrides to 100vh ONLY in installed standalone mode:
      // iOS miscomputes the dynamic viewport (dvh) on a freshly-launched
      // PWA's first paint → a bottom gap that only fills after a manual
      // scroll. 100vh is the static full-screen height that's correct from
      // frame one in standalone (no URL bar to track). Browser tabs keep
      // 100dvh. (Pattern verified against the tyrostrategy PWA.)
      className="bg-sidebar h-[100dvh] pwa:h-screen overflow-hidden"
      style={{
        "--sidebar-width": "15rem",
        "--sidebar-width-icon": "3rem",
      }}
    >
      {/* Yenilikler penceresi: kabukta mount edilir, sayfada değil —
          kullanıcı hangi rotaya düşerse düşsün bir kez çalışsın. Kendi
          koşullarını kendisi denetler ve çoğu açılışta hiçbir şey
          çizmez. */}
      <Suspense fallback={null}>
        <WhatsNewDialog />
        {pwa.ios && <IosInstallGuide />}
      </Suspense>
      {/* Çizmez, ısıtır: kullanıcı sohbete basmadan önce SDK + belirteç +
          handshake ödensin (bkz. warmStart.js). Sayfada değil BURADA, çünkü
          kullanıcı hangi sayfaya düşerse düşsün ısınma başlamalı. */}
      <WarmStart />
      <AppSidebar
        activeId={activeId}
        onSelectActiveId={onActiveIdChange}
        onNewChat={onNewChat}
        onOpenChatWithAgent={onOpenChatWithAgent}
      />
      <SidebarInset
        className={cn(
          "bg-background overflow-hidden md:m-2 md:ml-0 md:rounded-xl md:shadow-sm md:peer-data-[state=collapsed]:ml-2 md:transition-[margin] md:duration-200 md:ease-linear",
          // PWA standalone (iOS Add-to-Home Screen): the webview takes the
          // FULL viewport including under the status bar / Dynamic Island
          // and the home indicator. Without these insets, the Header
          // disappears behind the system clock. Browser-tab visits get
          // insets=0, so nothing changes there.
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:pt-0 md:pb-0",
          // `min-h-0` so this flex-1 child cannot push the parent past its
          // bounds when nested scrollers (chat thread, settings list) have
          // taller content than the viewport. Without it, the chat header /
          // composer scroll off-screen with the page.
          "min-h-0",
        )}
      >
        <Header
          activeId={activeId}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleDock={onToggleDock}
          dockOpen={chatMode === "dock"}
        />
        {/* Oturumun süresi dolunca her sayfada tek uyarı (çıkış → giriş). */}
        <SessionExpiredBanner />
        {/* min-h-0 here too — main is a flex-1 inside SidebarInset, same
            principle. Together with the chat root's min-h-0 (in ChatScreen)
            this makes the flex chain strictly bounded so only the chat
            scroller scrolls, never the page. */}
        {/* Row, not a single main: the chat column is a SIBLING of the page, so
            opening it shrinks the page instead of covering it. On /chat the
            page hides and the chat takes the whole area — same element, same
            position in the tree, only classes change. */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {/* Genişte sağ kenar rayı, darda header çizgisinin altında yatay şerit; panel açıkken
              ikisi de ana sütunun kenarına göre (`useNotchEdge`). */}
          {notch &&
            (wideNotch ? (
              <EdgeNotchFrame>
                <EdgeNotch scope={edgeNotchScope(activeId)} />
              </EdgeNotchFrame>
            ) : (
              <MobileNotch />
            ))}
          <PageDockContext.Provider value={dockValue}>
            <main
              ref={mainRef}
              /* Çentiğin ekranda olup olmadığını SAYFAYA söyleyen tek kanal.
               Prop olarak geçirilemezdi: sayfalar `App.jsx`teki `<Routes>`
               altında çiziliyor, bu bileşenin çocuğu değil. */
              data-notch={notch ? "on" : undefined}
              data-docked={docked ? "" : undefined}
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden",
                chatMode === "page" && "hidden",
              )}
            >
              {children}
            </main>
          </PageDockContext.Provider>
          <PageDockColumn
            owner={dock.owner}
            setTarget={dock.setTarget}
            hidden={chatMode === "page"}
          />
          <ChatDock mode={chatMode} onClose={onCloseDock} onExpandToPage={onExpandChatToPage}>
            {chatSlot}
          </ChatDock>
        </div>
      </SidebarInset>
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={navigate}
        onNewChat={onNewChat}
      />
    </SidebarProvider>
  )
}
