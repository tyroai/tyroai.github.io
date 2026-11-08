import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { ChatComposer } from "./ChatComposer"
import { ChatMessage } from "./ChatMessage"
import { PromptStarters } from "./PromptStarters"
import { PromptLab } from "./PromptLab"
import { useLocale } from "@/hooks/useLocale"
import { useConfig } from "@/hooks/useConfig"
import { useAppLock } from "@/hooks/useAuthorizations"
import { useAgentAccess } from "@/hooks/useAgentAccess"
import { ChatAccessFrame } from "./ChatAccessFrame"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMe } from "@/hooks/useMe"
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis"
import { requestFocusComposer } from "@/lib/chatBus"
import { promptPickUpdater } from "@/features/chat/lib/promptMerge"
import { NotifyOptIn } from "@/features/chat/NotifyOptIn"
import { WARM_START } from "@/lib/warmStartPolicy"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { bcp47 } from "@/lib/intl-cache"
import { greetingKey } from "@/lib/greeting"
import { EarlierConversationDivider } from "./EarlierConversationDivider"
import { ChatWelcome } from "./ChatWelcome"
import { ChatHeader } from "./ChatHeader"
import { DockBar } from "./DockControls"
import { useDockBar } from "@/components/layout/dockBar"
import { NewMessagePill } from "./NewMessagePill"
import { ConsentOverlays } from "./ConsentOverlays"
import { useChatTurn } from "./useChatTurn"

/**
 * @param onScreen - false while the user is on another route. The component
 *   stays MOUNTED either way (App.jsx keeps it alive so a slow answer isn't
 *   killed by navigating to the dashboard); this only says whether the user
 *   can currently see it, which is what decides whether a finished answer
 *   needs announcing.
 */
export function ChatScreen({ onReset, initialAgent, onScreen = true, inDock = false }) {
  const { t, locale } = useLocale()
  // Yalnız ısıtma rozetinin kapısı için okunuyor (bkz. WARM_START.badge).
  // Üç değerli hook; KATI `=== true` — çözülmemiş cevap yönetici sayılmaz.
  const isAdmin = useIsInGroup(ADMIN_GROUP_ID) === true
  // ⚠️ init async efektte REF üzerinden okunur (bkz. useChatTurn): MSAL ilk render'dan
  // sonra oturaklaşabiliyor.
  const startBadgeAllowed = WARM_START.badge === "*" || (WARM_START.badge === "admins" && isAdmin)
  const { agents, getAgent, settled: catalogSettled } = useConfig()
  const isMobile = useIsMobile()
  const lock = useAppLock()
  const navigate = useNavigate()
  /**
   * ⚠️ **VARSAYILAN ASİSTAN KİLİTLİ OLAMAZ.**
   *
   * `agents[0]` katalog sırasının ilki ve kişiye göre değişmiyor; kilit
   * ise kişiye göre. Kilitli bir asistan listenin başındaysa sohbeti açan
   * herkes — sidebar'daki "Yeni sohbet" dahil — onu SEÇMEDEN onunla
   * konuşmaya başlıyordu. Asistan seçici kilitliyi zaten pasif çiziyor
   * (`AgentSelect`), yani ekranda "seçilemez" yazan bir asistan aktif
   * olabiliyordu: kilidin en görünür yerinden sızması.
   *
   * ⚠️ Adres çubuğundan gelen `?agent=` de aynı süzgeçten geçer; kilitli
   * bir kimlik verilirse ilk açık asistana düşülür. Bu bir güvenlik sınırı
   * değil (Copilot çağrısı ayrı bir izin — bkz. appLockPolicy.js), ama
   * ekranın kendi kuralıyla çelişmemesi gerekiyor.
   *
   * ⚠️ Kilit ÇÖZÜLENE KADAR `isLocked` false döner, yani ilk kare bugünkü
   * davranışın aynısı; cevap gelince süzgeç tutar.
   */
  // ⚠️ SÜZGEÇ BURADA KURULMAZ, ORTAK KANCADAN GELİR (`useAgentAccess`):
  // aynı listeyi sidebar satırı ve "Yeni sohbet" düğmesi de soruyor ve üç
  // kopya, kuralın zamanla üç ayrı şeye dönüşmesi demekti.
  const agentAccess = useAgentAccess()
  // Panelde pencere düğmeleri (genişlik · tam sayfa · kapat); sohbet sayfasında null.
  const dockBar = useDockBar()
  const openAgents = agentAccess.openAgents
  const defaultAgentId = openAgents[0]?.id ?? agents[0]?.id ?? null
  const requestedOpen =
    initialAgent && openAgents.some((a) => a.id === initialAgent) ? initialAgent : null
  const [agent, setAgent] = useState(requestedOpen || defaultAgentId)
  const [orbState, setOrbState] = useState("idle")
  // Aktif agent + schema adı render'da hesaplanır. schemaName init effect'in
  // bağımlılığıdır: agents (ConfigProvider) ASENKRON yüklenir; agent zaten HR
  // olsa bile ilk render'da getAgent() undefined dönebilir → init erken çıkar.
  // schemaName deps'te olduğu için agents yüklenince init kendiliğinden çalışır.
  const [promptLabOpen, setPromptLabOpen] = useState(false)
  // Son yazılan hazır istem — handlePromptPick'in "üstüne yaz mı, alt satıra
  // ekle mi" kararı buna bakıyor.
  const lastPromptRef = useRef("")
  /**
   * ⚠️ **AKTİF ASİSTAN TEK ÇIKIŞ NOKTASI, kilit BURADA da tutar.**
   *
   * Varsayılanı kilitsiz seçmek yetmiyordu: `ConfigProvider.getAgent`
   * kimliği bulamazsa listenin İLKİNE düşüyor (`open[0]`) ve o liste
   * yalnız `isActive`e göre süzülü — kilide bakmıyor. Katalog geç
   * yüklendiğinde, `?agent=` bilinmeyen bir kimlik taşıdığında ya da
   * kayıt yeniden adlandırıldığında o geri düşüş kilitli bir asistan
   * döndürebiliyordu. Konuşma `activeAgent`in `agentId`si üzerinden
   * kuruluyor, yani kapının gerçekten kapandığı yer burası.
   *
   * `getAgent`i düzeltmek yerine burada süzmek bilinçli: ConfigProvider
   * kilidi TANIMIYOR ve tanımamalı — kilit oturuma bağlı, katalog değil
   * (aynı gerekçe `markAgentAccess`in `state` yerine `value` memo'sunda
   * olmasında da yazılı).
   */
  const resolveOpenAgent = useCallback(
    (id) => {
      const found = getAgent(id)
      if (found && !lock.isLocked(found.name)) return found
      return openAgents[0] ?? null
    },
    [getAgent, lock, openAgents],
  )
  const activeAgent = resolveOpenAgent(agent)
  // ⚠️ SEÇİCİYE GİDEN KİMLİK, HAM `agent` DEĞİL — gerçekten aktif olan.
  // `AgentSelect` kendi `getAgent(value)`sini çağırıyor ve o kilide
  // bakmıyor; ham kimliği verseydik kutuda kilitli asistanın adı yazarken
  // konuşma başka asistanla kuruluyor olurdu. Ekranın söylediği ile
  // çalışan aynı şey olmalı.
  const activeAgentId = activeAgent?.id ?? agent
  const schemaName = activeAgent?.agentId
  const [input, setInput] = useState("")
  const [speakingLevel, setSpeakingLevel] = useState(0)
  const { isSpeaking: ttsSpeaking, speak, cancel: cancelTts } = useSpeechSynthesis()
  // Debounce timer for typing → thinking → idle transitions.
  const typingTimerRef = useRef(null)
  const turn = useChatTurn({
    agent,
    setAgent,
    agents,
    catalogSettled,
    initialAgentId: requestedOpen || defaultAgentId,
    schemaName,
    resolveOpenAgent,
    input,
    setInput,
    setOrbState,
    startBadgeAllowed,
    onScreen,
    inDock,
    t,
  })
  const { messages, restoredCount, busy, briefPending } = turn
  const {
    isNearBottom,
    setIsNearBottom,
    unread,
    setUnread,
    attachScrollRef,
    attachContentRef,
    handleScroll,
    scrollToBottom,
  } = turn.scroll
  const greetHour = new Date().getHours()
  const me = useMe()
  const firstName = me.name || ""

  // Speaking-mode level oscillation for the orb.
  useEffect(() => {
    if (orbState !== "speaking") return
    const id = setInterval(() => {
      setSpeakingLevel(0.22 + Math.random() * 0.78)
    }, 95)
    return () => clearInterval(id)
  }, [orbState])

  const effectiveLevel = orbState === "speaking" ? speakingLevel : 0

  // Orb click → speak the greeting line (the static text under the orb,
  // with the user's name woven in) in the current locale. While speaking,
  // an effect below forces orb into "speaking" mode. Click again to cancel.
  // No-op while the mic is listening (Web Speech in & out collide on iOS).
  function handleOrbClick() {
    if (orbState === "listening") return
    if (ttsSpeaking) {
      cancelTts()
      return
    }
    const greeting = t(greetingKey(greetHour))
    const lead = t("chat.subtitle.lead")
    const highlight = t("chat.subtitle.highlight")
    const fullText = `${greeting}, ${firstName}. ${lead} ${highlight}`
    const lang = bcp47(locale)
    // rate 1.1 — slightly faster than default (1.0) so the greeting sounds
    // brisk and confident instead of plodding. Cloud / neural voices handle
    // it cleanly; if the user is on a slow bundled OS voice the engine will
    // still keep up — most older voices clip more at low rates than high.
    speak(fullText, { lang, rate: 1.1 })
  }

  // The composer drives the recognizer; we only need to mirror its boolean
  // listening flag into orbState. Listening always wins over any other mode.
  function handleMicToggle(nextListening) {
    if (nextListening) setOrbState("listening")
    else setOrbState((s) => (s === "listening" ? "idle" : s))
  }

  /**
   * Seçilen hazır istem GÖNDERİLMEZ, besteciye yazılır.
   *
   * İstemlerin çoğu `[proje no]` gibi doldurulacak bir yer taşıyor; doğrudan
   * göndermek asistana yarım bir cümle yollamak olurdu. Odak isteği
   * `selectPlaceholder` ile gidiyor: composer ilk yer tutucuyu seçili
   * bırakıyor, kullanıcı yazmaya başlayınca üzerine yazıyor.
   */
  function handlePromptPick(text) {
    // Kullanıcının YAZDIĞI metin silinmez, aynı istem alt alta çoğalmaz —
    // kural `features/chat/lib/promptMerge.js`te (alanlı kartlar da aynısını kullanıyor).
    setInput(promptPickUpdater(lastPromptRef, text))
    setPromptLabOpen(false)
    requestAnimationFrame(() => requestFocusComposer({ selectPlaceholder: true }))
  }

  // User-typing → "thinking" with a 600 ms idle debounce. Mic listening and
  // TTS speaking both outrank typing — don't flap them.
  function handleInputChange(next) {
    setInput(next)
    if (orbState === "listening" || orbState === "speaking" || ttsSpeaking) return
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    if (next.trim()) {
      if (orbState !== "thinking") setOrbState("thinking")
      typingTimerRef.current = setTimeout(() => {
        setOrbState((s) => (s === "thinking" ? "idle" : s))
      }, 600)
    } else {
      setOrbState((s) => (s === "thinking" ? "idle" : s))
    }
  }

  // Force orb into "speaking" while the TTS engine is playing the greeting,
  // revert to "idle" when it finishes (unless something else has claimed
  // the orb in the meantime). This is a legitimate external-signal-to-state
  // mirror (the speechSynthesis engine fires onstart/onend through the hook
  // and we need to reflect that in the orb's visual mode).
  useEffect(() => {
    if (ttsSpeaking) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrbState("speaking")
    } else {
      setOrbState((s) => (s === "speaking" ? "idle" : s))
    }
  }, [ttsSpeaking])

  // Tear down the typing debounce on unmount. Bildirimin ömrünü sonner
  // yönetiyor, burada kapatılacak bir zamanlayıcı yok.
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  function handleResetLocal() {
    turn.resetConversation()
    setOrbState("idle")
    setInput("")
    setUnread(0)
    setIsNearBottom(true)
    onReset?.()
  }

  // "Boş" = gösterilecek GERÇEK içerik yok. init effect'i ağ beklemesi
  // başlarken içeriği boş bir placeholder assistant balonu ekliyor; bunu
  // "dolu" saymak orb karşılama ekranını anında tam chat layout'una atlatıp
  // boş bir "yazıyor" balonu flash'liyordu. İçeriksiz balonları yok sayarak
  // greeting (metin/kart/suggested) GERÇEKTEN gelene kadar orb ekranında
  // kalıyoruz — orb'un "thinking" animasyonu zaten yükleniyor göstergesi.
  const hasRenderableContent = (m) =>
    Boolean(m.content) ||
    m.attachments?.length > 0 ||
    m.suggestedActions?.length > 0 ||
    m.incomplete
  const isEmpty = !messages.some(hasRenderableContent)
  // Panelin düğmeleri konuşmada başlığın sağında. Karşılamada başlık yok (kahraman küre), kilitliyken
  // içerik etkileşimsiz bir katmanda: o iki hâlde ayrı şeritte, katmanın DIŞINDA — panel kapanabilsin.
  const ownBar = dockBar && (isEmpty || agentAccess.locked) ? <DockBar bar={dockBar} /> : null

  // Erişim kapısı ve panel şeridi (gerekçeler `ChatAccessFrame`te): iki dönüş de buradan geçer.
  const withAccessOverlay = (node) => (
    <ChatAccessFrame
      locked={agentAccess.locked}
      bar={ownBar}
      onGoToCatalogue={() => navigate("/dashboard")}
    >
      {node}
    </ChatAccessFrame>
  )

  if (isEmpty) {
    return withAccessOverlay(
      // Boş ekran KENDİ İÇİNDE kayar. Kabuk `h-[100dvh] overflow-hidden`
      // ile kilitli, yani buradaki içerik ekrandan uzunsa hiçbir yere
      // sığmadan KIRPILIYORDU: bir konu açıldığında (İK on istem taşıyor)
      // listenin sonu ekranın altında kalıyor ve ona ulaşmanın yolu
      // olmuyordu. `justify-center` yerine `m-auto`: içerik sığdığında yine
      // dikeyde ortalanır, sığmadığında yukarıdan başlar ve kaydırılır —
      // taşan bir flex çocuğunu ortalamak üst tarafı erişilemez kılıyor.
      <div className="@container/chat flex w-full flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-6 sm:py-8 short:py-4 shorter:py-3">
        <div className="m-auto flex w-full max-w-4xl flex-col items-center [&>*]:shrink-0">
          {/* Küre SABİT: bu ekranın kahramanı o ve alçak bir pencerede
            küçültülecek ilk şey değil. Yer açan şey aşağıdaki boşluklar ve
            öneri kartlarının yoğunluğu (bkz. `short:` / `shorter:`). */}
          <BrandOrb
            surface="chat"
            state={orbState}
            level={effectiveLevel}
            size={isMobile ? 110 : 150}
            onClick={handleOrbClick}
            ariaLabel={t("chat.orb.aria")}
          />
          <ChatWelcome greetHour={greetHour} firstName={firstName} />
          <ChatComposer
            value={input}
            onChange={handleInputChange}
            onSend={turn.handleSend}
            agent={activeAgentId}
            agentName={activeAgent?.name}
            onAgentChange={(id) => setAgent(id)}
            onMicToggle={handleMicToggle}
            onOpenPromptLab={() => setPromptLabOpen(true)}
            promptLabOpen={promptLabOpen}
            micActive={orbState === "listening"}
            disabled={busy}
            className="mt-6 w-full max-w-3xl sm:mt-8 short:mt-4 shorter:mt-3"
          />
          <div className="mt-4 w-full max-w-3xl short:mt-3 shorter:mt-2">
            <PromptStarters
              agentName={activeAgent?.name}
              onPick={handlePromptPick}
              onOpenLab={() => setPromptLabOpen(true)}
              // Her yerde kapalı başlar (PC dahil, ürün sahibi): kartlar bir sekmeye basınca açılır.
              collapsed
            />
          </div>
          <PromptLab
            open={promptLabOpen}
            onOpenChange={setPromptLabOpen}
            agentName={activeAgent?.name}
            onPick={handlePromptPick}
          />
        </div>
      </div>,
    )
  }

  // Canonical 3-row chat layout:
  //   row 1: header  (auto)
  //   row 2: scroll  (flex-1 min-h-0 overflow-y-auto overscroll-contain)
  //   row 3: composer (auto, pb-safe)
  // min-h-0 on the scroller is non-negotiable — without it flex children
  // can't shrink below their content height, so the scroller would push the
  // composer off-screen. Composer is NOT sticky — the 3-row flex naturally
  // pins it. Sticky inside a transformed/overflow-hidden ancestor is fragile
  // on iOS Safari. Root uses h-full to inherit from DashboardLayout's main,
  // which itself is flex-1 of the viewport.
  return withAccessOverlay(
    // min-h-0 + h-full lock the chat shell to its parent's height so the
    // flex-1 scroller below cannot grow taller than the viewport. Without
    // min-h-0, 10+ messages push this column past 100dvh and the WHOLE
    // page starts scrolling — the chat header and composer disappear.
    // @container/chat: the composer, the message type and the activity row
    // scale off THIS element's width, not the viewport's. Same component in
    // the page and in the dock, two very different amounts of room — a media
    // query cannot tell them apart, a container query can.
    <div className="@container/chat relative mx-auto flex h-full min-h-0 w-full max-w-4xl flex-1 flex-col px-3 pt-2 sm:px-4 sm:pt-3">
      {/* Row 1 — header. Mini orb on the left mirrors the modes the big
          orb plays (idle / listening / thinking / speaking) so the user
          gets a visual "agent state" cue. Below the agent name we show
          the agent's description by default, swapping in "Yazıyor…" when
          the orb is in thinking mode so the user gets a clear in-progress
          signal. */}
      <ChatHeader
        orbState={orbState}
        level={effectiveLevel}
        onOrbClick={handleOrbClick}
        activeAgent={activeAgent}
        onReset={handleResetLocal}
        bar={agentAccess.locked ? null : dockBar}
      />

      {/* Kart, başlık çizgisinin ÜSTÜnde durur ve gerekirse başlık yazısının
          üstüne biner. Portal ile body'ye render edilir — `main`'in
          overflow-hidden'ı yoksa tepesini kırpıyordu. */}
      {/* Row 2 — message scroller. overscroll-contain blocks Android PTR +
          iOS rubber-band from bubbling to the page. onTouchStart blurs the
          textarea so the soft keyboard dismisses when the user taps an
          older message — matches ChatGPT/Claude mobile behavior. */}
      <div
        ref={attachScrollRef}
        onScroll={handleScroll}
        onTouchStart={() => {
          if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
          }
        }}
        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-1 py-3"
      >
        <div ref={attachContentRef} className="space-y-4">
          {/* Geri gelen satırlar tarihlenir: aksi hâlde dünkü bir yanıt bu
              ziyaretin ilk mesajıymış gibi okunuyor. */}
          {restoredCount > 0 && <EarlierConversationDivider at={messages[0]?.time ?? null} />}
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onCardAction={turn.onCardAction}
              onSuggestedAction={turn.onSuggestedAction}
              onRetry={turn.onRetry}
            />
          ))}
          {/* Gün özeti sorusu, devralma kararı beklenirken (bkz. useParkedAsk);
              gerçek balon çizildiği anda kalkar. */}
          {briefPending && (
            <ChatMessage
              message={{
                id: "brief-pending",
                role: "user",
                content: briefPending.text,
                attachments: [],
                time: briefPending.time,
              }}
            />
          )}
        </div>
      </div>

      {/* Floating new-message pill — appears above the composer when the user
          has scrolled up and a new assistant message arrives. */}
      <NewMessagePill unread={unread} isNearBottom={isNearBottom} onClick={scrollToBottom} />

      {/* Row 3 — composer. Symmetric py only: the safe-area-inset-bottom
          is ALREADY applied one level up by SidebarInset
          (pb-[env(safe-area-inset-bottom)] in DashboardLayout). Adding env()
          here too would double the home-indicator gutter (~68 px on iOS PWA)
          and leave a tall bg-background band above the indicator — the
          "white gap" regression. Solid bg keeps the indicator from bleeding
          through the gradient. */}
      <div className="chat-composer-row shrink-0 bg-background py-2 pwa:pb-5 sm:py-3">
        {/* Yalnızca kullanıcı gerçekten bir soru sorduktan sonra çıkar — o an
            "bu ne kadar sürecek?" sorusu zaten akılda, teklif oraya oturuyor. */}
        <NotifyOptIn visible={messages.some((m) => m.role === "user")} />
        <ChatComposer
          value={input}
          onChange={handleInputChange}
          onSend={turn.handleSend}
          agent={activeAgentId}
          agentName={activeAgent?.name}
          onAgentChange={(id) => setAgent(id)}
          onMicToggle={handleMicToggle}
          onOpenPromptLab={() => setPromptLabOpen(true)}
          promptLabOpen={promptLabOpen}
          micActive={orbState === "listening"}
          disabled={busy}
        />
      </div>

      {/* Karşılama şeridi sohbet başlayınca ekranda kalmıyor; hazır
          istemlere bestecideki ampulden dönülüyor. */}
      <PromptLab
        open={promptLabOpen}
        onOpenChange={setPromptLabOpen}
        agentName={activeAgent?.name}
        onPick={handlePromptPick}
      />

      <ConsentOverlays
        prompt={turn.consentPrompt}
        waiting={turn.consentWait}
        onApprove={turn.approveConsent}
        onReject={turn.rejectConsent}
      />
    </div>,
  )
}
