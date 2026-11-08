import { lazy, Suspense, useEffect, useRef, useState } from "react"
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import { onCloseChat, onOpenChat, setPendingAsk } from "@/lib/chatBus"
import { onBackStep } from "@/hooks/useBackToClose"
import { usePageAccess } from "@/hooks/usePageAccess"
import { ConfigProvider } from "@/providers/ConfigProvider"
import { prefetchOnIdle, ROUTE_CHUNKS } from "@/lib/routeChunks"
import { MeetingSummaryHost } from "@/features/myspace/summary/MeetingSummaryHost"
import { MeetingAlertHost } from "@/features/meeting-alert/MeetingAlertHost"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

// Sohbet ilk açılışta mount olur (PersistentChat): kodu da o an (ya da boşta önceden) iner.
const ChatScreen = lazy(ROUTE_CHUNKS["chat"])
// Çözümler yalnız yöneticilere ve adresle açılır: kabuğun parçasında yeri yok.
const AppLauncher = lazy(ROUTE_CHUNKS["dashboard"])
// Yardım seyrek açılır: arama, kılavuz ve SSS kodu giriş paketine girmesin.
const HelpPage = lazy(ROUTE_CHUNKS["help"])

// Profilim yalnızca kullanıcı menüsünden / aramadan açılıyor: giriş paketine
// koymak, hiç açmayan herkese Graph `/me` kartını ve yetki panelini
// indirtirdi. Chunk tıklamada iniyor.
const ProfilePage = lazy(ROUTE_CHUNKS["profile"])

// Yenilikler TEMBEL: changelog metinleri (TR + EN) yalnız büyüyor ve
// sayfayı hiç açmayan herkese inmemeli.
const WhatsNewPage = lazy(ROUTE_CHUNKS["whats-new"])

// Güvenlik TEMBEL: yalnız yöneticinin açtığı bir döküm ekranı, giriş
// paketinde yeri yok.
const SecurityPage = lazy(ROUTE_CHUNKS["security"])

// Gündem Akışı TEMBEL: Graph sorgusu, posta gövdesi çerçevesi ve sağ ray
// giriş paketinde yeri olmayan bir yük — akışı hiç açmayan kullanıcı
// indirmesin (ProfilePage ve SecurityPage'in aynı gerekçesi).
const FeedPage = lazy(ROUTE_CHUNKS["feed"])

// Akışım — kişinin çalışma alanı. Tembel: önizleme ekibinde ve sayfayı hiç
// açmayan herkese kartlarını indirtmenin karşılığı yok. Kapı ROTADA (aşağıda),
// yani kapıda kalan kişiye parça hiç inmiyor.
const MySpacePage = lazy(ROUTE_CHUNKS["myspace"])

// To-Do — Microsoft To Do sayfası. Tembel ve kapısı rotada (Akışım'ın kuralı):
// maskotun panosu, grafikler ve ayrıntı paneli yalnız sayfayı açana iniyor.
const TodoPage = lazy(ROUTE_CHUNKS["todo"])
const SelfServicePage = lazy(ROUTE_CHUNKS["selfservice"])
// Tibotlar — Xurrent talepleri, salt okunur (kitle `lib/tibotPolicy`).
const TibotPage = lazy(ROUTE_CHUNKS.tibot)
// tyroRM bölümü (`/rm?view=…`): yetkisiz kişiye kendi kapısını gösterir.
const RmSection = lazy(ROUTE_CHUNKS.rm)
const WidgetsPage = lazy(ROUTE_CHUNKS["widgets"])
// Takvim: Outlook, To Do, izinler ve kutlamalar tek sayfada; tembel, kapısı rotada.
const CalendarPage = lazy(ROUTE_CHUNKS["calendar"])

const PATH_TO_ID = {
  "/dashboard": "dashboard",
  "/chat": "chat",
  "/feed": "feed",
  "/myspace": "myspace",
  "/todo": "todo",
  "/calendar": "calendar",
  "/self-service": "selfservice",
  "/tibot": "tibot",
  "/widgets": "widgets",
  "/help": "help",
  "/profile": "profile",
  "/whats-new": "whats-new",
  "/security": "security",
  "/rm": "rm",
}

const ID_TO_PATH = {
  dashboard: "/dashboard",
  chat: "/chat",
  feed: "/feed",
  myspace: "/myspace",
  todo: "/todo",
  calendar: "/calendar",
  selfservice: "/self-service",
  tibot: "/tibot",
  widgets: "/widgets",
  help: "/help",
  profile: "/profile",
  "whats-new": "/whats-new",
  security: "/security",
  rm: "/rm",
}

/**
 * Keeps ONE ChatScreen alive for the whole session instead of mounting it as
 * the /chat route element.
 *
 * An agent answer streams over an SSE connection owned by ChatScreen. As a
 * route element it was unmounted the moment the user navigated to the
 * dashboard — killing the reply they were waiting on and leaving a bubble
 * that says "yazıyor" forever when they came back. Since the whole point is
 * "ask, go do something else, get told when it's ready", the chat has to
 * outlive navigation.
 *
 * So it renders here, as a sibling of <Routes>, and only its VISIBILITY
 * changes with the route: `display: contents` while on /chat (transparent to
 * layout, so ChatScreen stays a direct flex child of <main> exactly as
 * before), `display: none` elsewhere. The /chat route element renders null.
 *
 * Two details that matter:
 *   • Lazy first mount — mounting at boot would open a Copilot conversation
 *     for every user who never opens the chat.
 *   • The `?reset=` / `?agent=` params are latched only while on /chat.
 *     Reading them live would remount the chat (new key) the instant the
 *     user navigated away and the query string disappeared — exactly the
 *     unmount this component exists to prevent.
 */
function PersistentChat({ isChat, visible }) {
  const [params] = useSearchParams()
  // null when absent — the DISTINCTION matters, see below.
  const resetParam = params.get("reset")
  const agentParam = params.get("agent")

  // Latched during render (React's "adjust state when props change" pattern)
  // rather than in an effect: an effect would commit one frame with the old
  // key and then remount, and it trips the cascading-render lint rule.
  //
  // A new key is taken ONLY when a `reset` param is actually present. That is
  // what separates "start a new chat" (the sidebar's Yeni sohbet / an agent
  // card, both of which navigate with ?reset=<ts>) from "go back to the chat"
  // (the sidebar's Chat item, which navigates to a bare /chat). Keying off
  // the bare URL would wipe the running conversation on every return trip —
  // the exact opposite of what this component is for.
  const [latched, setLatched] = useState(() => ({
    mounted: visible,
    key: resetParam ?? "0",
    agent: agentParam,
  }))
  const wantsNewChat =
    resetParam !== null && (resetParam !== latched.key || agentParam !== latched.agent)
  // Mounting is driven by VISIBILITY so opening the dock brings the chat up
  // too; the reset/agent latch stays route-only, since a dock open has no
  // params to read and must never wipe a running conversation.
  if ((visible && !latched.mounted) || (isChat && wantsNewChat)) {
    setLatched({
      mounted: true,
      key: wantsNewChat ? resetParam : latched.key,
      agent: wantsNewChat ? agentParam : latched.agent,
    })
  }

  if (!latched.mounted) return null

  // No wrapper: ChatDock owns the container, and an extra div between it and
  // ChatScreen would break the flex chain the chat scroller depends on.
  return (
    <Suspense fallback={null}>
      <ChatScreen
        key={latched.key}
        initialAgent={latched.agent}
        onScreen={visible}
        // Dock mu sayfa mı: öneri kartları dock'ta KAPALI başlar (yer
        // besteciye ait). `isChat` zaten bu ayrımı taşıyor.
        inDock={!isChat}
      />
    </Suspense>
  )
}

/**
 * Girişten sonraki uygulama (kabuk + sayfalar). Kimlik kapısı `AuthGate`te; bu modül yalnız
 * oturum varken iner (`lib/bootChunks`), yani burada kişi her zaman girişli.
 */
function App() {
  const navigate = useNavigate()
  const location = useLocation()
  // Kitlesi daraltılmış iki sayfanın (Keşfet · Akışım) kararı — kural
  // `lib/pageAccess.js`te. Kanca erken dönüşlerden ÖNCE (kanca kuralı).
  const access = usePageAccess()

  const activeId = PATH_TO_ID[location.pathname] ?? "myspace"
  const isChat = location.pathname === "/chat"
  const [dockOpen, setDockOpen] = useState(false)
  // page beats dock: on /chat the conversation IS the page, so a dock there
  // would be a second copy of the same thing.
  const chatMode = isChat ? "page" : dockOpen ? "dock" : "hidden"

  // "Take me back to the conversation" — an answer notification, its in-app
  // toast, or one of the header panels parking a question. It opens the DOCK
  // rather than navigating: whoever asked was looking at something, and taking
  // that page away to answer is exactly what the dock exists to stop. Already
  // on /chat, there is nothing to do. No `reset` param either way — this must
  // land on the RUNNING chat, not start a new one.
  useEffect(() => {
    return onOpenChat(() => {
      if (location.pathname !== "/chat") setDockOpen(true)
    })
  }, [location.pathname])
  // Sohbetteki talep kartından forma dönüş: rıhtım kapanır, form görünür.
  useEffect(() => onCloseChat(() => setDockOpen(false)), [])
  // Boşta sayfa parçalarını önceden indir; kapısı kapalı sayfa (yetki yok) istenmez.
  const accessRef = useRef(access)
  useEffect(() => {
    accessRef.current = access
  })
  useEffect(
    () =>
      prefetchOnIdle((id) => {
        const key = id === "selfservice" ? "selfService" : id
        return id === "chat" || accessRef.current[key] === true
      }),
    [],
  )

  function handleActiveIdChange(id) {
    const path = ID_TO_PATH[id] ?? "/myspace"
    navigate(path)
  }

  /**
   * `ask` YOKSA bugünkü davranış: yeni bir sohbet (remount).
   *
   * ⚠️ Gün özeti dalında `?reset=` **BİLEREK YOK**. İki sebep: (1) remount,
   * akmakta olan devralmayı öldürür — tam da beklemesini istemediğimiz
   * cevabı; (2) kazanç da yok, çünkü `?reset=` dökümü zaten silmiyor (init
   * `loadChatSession`ı okuyup `resumed` dalına düşüyor). Temiz konuşma
   * kararını ChatScreen'in brief dalı veriyor, URL değil.
   *
   * ⚠️ Guard `ask?.question` şeklinde, çünkü bugün `onClick={onNewChat}`
   * tıklama OLAYINI argüman olarak geçiriyor.
   */
  function handleNewChat(ask) {
    if (ask?.question) {
      setPendingAsk({
        question: ask.question,
        agent: ask.agentName,
        kind: "brief",
        windowId: ask.windowId,
      })
      navigate("/chat")
    } else if (ask?.navigateOnly) {
      // Özet bu pencerede zaten dökümde — ikinci kez sorma, yalnız götür.
      navigate("/chat")
    } else {
      navigate(`/chat?reset=${Date.now()}`)
    }
  }

  function handleOpenChatWithAgent(agentId) {
    navigate(`/chat?agent=${encodeURIComponent(agentId)}&reset=${Date.now()}`)
  }

  return (
    <>
      <DashboardLayout
        activeId={activeId}
        onActiveIdChange={handleActiveIdChange}
        onNewChat={handleNewChat}
        onOpenChatWithAgent={handleOpenChatWithAgent}
        chatMode={chatMode}
        onCloseDock={() => setDockOpen(false)}
        onToggleDock={() => setDockOpen((v) => !v)}
        onExpandChatToPage={() => {
          setDockOpen(false)
          // Telefonda açık panelin Geri adımı sohbet sayfasına dönüşür (geçmişte boş adım kalmaz).
          navigate("/chat", { replace: onBackStep() })
        }}
        // Passed as a slot, not as a child among the routes: the layout puts it
        // in the chat column so it keeps ONE parent in every mode — page, dock
        // and hidden are class changes, never a re-parent (which would remount
        // the chat and kill the stream an answer is arriving on).
        chatSlot={<PersistentChat isChat={isChat} visible={chatMode !== "hidden"} />}
      >
        {/* Sayfa çökse de kabuk (sidebar, header, sohbet) ayakta kalır; adres değişince sıfırlanır.
            key değil resetKey: key, tembel sayfalar arası geçişte açık sayfayı boşlukla değiştirirdi. */}
        <ErrorBoundary
          scope="page"
          resetKey={location.pathname}
          onHome={() => navigate("/myspace")}
        >
          <Routes>
            {/* ⚠️ AÇILIŞ SAYFASI ANASAYFA (`/myspace`, 2026-10-04, istek:
                *"tyro'da Akışım ana sayfa başta olacak… ilk açılışta bu sayfa
                açılacak"*; ad önce "Anasayfam", aynı gün "Anasayfa" oldu).
                Dashboard'un adı Çözümler oldu ve sidebar'dan
                profil menüsüne taşındı; rotası `/dashboard` olarak KALDI —
                yer imleri, Yardım rehberleri ve Yenilikler kayıtları o adresi
                taşıyor. Anasayfa'nın kapısı kapanırsa (`MYSPACE.enabled`)
                aşağıdaki rota yine Çözümler'e düşer. */}
            <Route path="/" element={<Navigate to="/myspace" replace />} />
            {/* Çözümler yalnız uygulama yöneticilerine (`lib/solutionsPolicy.js`). */}
            <Route
              path="/dashboard"
              element={
                access.solutions ? (
                  <Suspense fallback={null}>
                    <AppLauncher onOpenChat={handleOpenChatWithAgent} onNewChat={handleNewChat} />
                  </Suspense>
                ) : access.pending.solutions ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            {/* Element is null: PersistentChat above owns the chat UI. The route
                still has to exist so "/chat" doesn't fall through to the
                catch-all redirect. */}
            <Route path="/chat" element={null} />
            {/* ⚠️ AYARLAR SAYFASI KALDIRILDI — her şey Profilim'de yönetiliyor
                (tyroTrade'deki düzenin aynısı). Rota SİLİNMEDİ, yönlendiriyor:
                kullanıcıların yer imleri ve Yardım'daki kartlar bu adresi
                taşıyor, 404 vermek onları kırardı. */}
            <Route path="/settings" element={<Navigate to="/profile?tab=catalog" replace />} />
            <Route
              path="/help"
              element={
                <Suspense fallback={null}>
                  <HelpPage />
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={null}>
                  <ProfilePage />
                </Suspense>
              }
            />
            {/* Yenilikler: uygulamaya gelen değişikliklerin tam listesi.
                İzin kapısı YOK — yöneticiye özel kayıtları listenin kendisi
                zaten süzüyor (bkz. changelog.js › audience). */}
            {/* Güvenlik yalnız uygulama yöneticilerine (`lib/pageAccess.js` › `security`): yönetici
                olmayan adresi yazsa da sayfayı görmez, Anasayfa'ya düşer; cevap yoldayken bekler. */}
            <Route
              path="/security"
              element={
                access.security ? (
                  <Suspense fallback={null}>
                    <SecurityPage />
                  </Suspense>
                ) : access.pending.security ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            {/* ⚠️ YETKİLER ARTIK AYRI SAYFA DEĞİL (2026-09-17, istek üzerine):
                kullanıcı yetkileri ve yetki talepleri `/security`nin ilk iki
                sekmesi oldu. Rota SİLİNMEDİ, yönlendiriyor — changelog'un
                `to: "/authorizations"` kaydı ve kullanıcıların yer imleri
                kırılmasın. `replace` çünkü geri düğmesi kullanıcıyı buraya
                geri getirip yeniden yönlendirmemeli. */}
            <Route path="/authorizations" element={<Navigate to="/security?tab=users" replace />} />
            {/* ⚠️ ROTA GERÇEK bir kapı: politika dosyası "geri almak tek satır"
                diye söz veriyor ve rota koşulsuz olsaydı o söz tutulmazdı —
                sidebar satırı gitse de adres hâlâ açılırdı. Kapı artık kişiye
                de bakıyor (`access.feed`: şalter + kitle). Kapıda kalan
                `/feed` ya da paylaşılmış bir `?post=` bağlantısı dashboard'a
                düşer; `pending` yalnız `"admins"` kitlesinde ve cevap
                yoldayken — o arada yönlendirmek, yer imiyle gelen yöneticiyi
                cevap gelmeden sayfadan atardı. */}
            <Route
              path="/feed"
              element={
                access.feed ? (
                  <Suspense fallback={null}>
                    <FeedPage />
                  </Suspense>
                ) : access.pending.feed ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            {/* Keşfet'le AYNI kapı ve aynı kitle (`MYSPACE.audience`). */}
            <Route
              path="/myspace"
              element={
                access.myspace ? (
                  <Suspense fallback={null}>
                    <MySpacePage onOpenChat={handleOpenChatWithAgent} onNewChat={handleNewChat} />
                  </Suspense>
                ) : access.pending.myspace ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            {/* Takvim — yalnız uygulama yöneticileri (`lib/calendarPolicy.js`). */}
            <Route
              path="/calendar"
              element={
                access.calendar ? (
                  <Suspense fallback={null}>
                    <CalendarPage />
                  </Suspense>
                ) : access.pending.calendar ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            {/* To-Do — Akışım'la AYNI kitle (`TODO_PAGE.audience`). */}
            <Route
              path="/todo"
              element={
                access.todo ? (
                  <Suspense fallback={null}>
                    <TodoPage />
                  </Suspense>
                ) : access.pending.todo ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            {/* Self Servis — izin, masraf ve iş avansı kayıtları (`SELF_SERVICE_PAGE.audience`). */}
            <Route
              path="/self-service"
              element={
                access.selfService ? (
                  <Suspense fallback={null}>
                    <SelfServicePage />
                  </Suspense>
                ) : access.pending.selfService ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            <Route
              path="/tibot"
              element={
                access.tibot ? (
                  <Suspense fallback={null}>
                    <TibotPage />
                  </Suspense>
                ) : access.pending.tibot ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            {/* Pano (widget sayfası) — Anasayfa'nın deneme kopyası (`WIDGETS_PAGE.audience`). */}
            <Route
              path="/widgets"
              element={
                access.widgets ? (
                  <Suspense fallback={null}>
                    <WidgetsPage onOpenChat={handleOpenChatWithAgent} onNewChat={handleNewChat} />
                  </Suspense>
                ) : access.pending.widgets ? null : (
                  <Navigate to={access.home} replace />
                )
              }
            />
            <Route
              path="/rm"
              element={
                <Suspense fallback={null}>
                  <RmSection />
                </Suspense>
              }
            />
            <Route
              path="/whats-new"
              element={
                <Suspense fallback={null}>
                  <WhatsNewPage />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/myspace" replace />} />
          </Routes>
        </ErrorBoundary>
      </DashboardLayout>
      {/* Toplantı özeti: takvim, çentik ve Anasayfa aynı pencereyi açar. */}
      <MeetingSummaryHost />
      {/* Sıradaki toplantıya 15 dk kala geri sayım (her sayfada). */}
      <MeetingAlertHost />
    </>
  )
}

// Katalog (ConfigProvider) yalnız girişli kabukta: giriş ekranı Dataverse kodunu indirmesin.
export default function SignedInApp() {
  return (
    <ConfigProvider>
      <App />
    </ConfigProvider>
  )
}
