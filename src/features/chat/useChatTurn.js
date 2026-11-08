import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { loadChatSession, scheduleChatSessionSave, clearChatSession } from "@/lib/chatSession"
import { useAnswerNotification } from "@/features/chat/hooks/useAnswerNotification"
import { notify } from "@/lib/notify"
import { showFirstReplyToast } from "@/features/chat/lib/firstReplyToast"
import { textWithStagedFiles } from "@/features/chat/lib/chatFileStaging"
import { chatFailureMessage } from "@/features/chat/lib/chatFailure"
import { copilotPort } from "@/features/chat/lib/copilotPort"
import { createTurnEngine } from "@/features/chat/lib/turnEngine"
import { initConversation } from "@/features/chat/lib/initConversation"
import { useParkedAsk } from "./useParkedAsk"
import { useChatScroll } from "./useChatScroll"

/**
 * Sohbet turunu React'e bağlayan ince kanca: döküm, meşgul/onay durumu, konuşma ref'leri,
 * kayıt ve init effect'leri. Tur mantığı `features/chat/lib/` altında (turnEngine, initConversation);
 * ChatScreen yalnız çizer. Kanca sırası eski ChatScreen'le aynı (scroll → bildirici → park).
 */
export function useChatTurn({
  agent,
  setAgent,
  agents,
  catalogSettled,
  initialAgentId,
  schemaName,
  resolveOpenAgent,
  input,
  setInput,
  setOrbState,
  startBadgeAllowed,
  onScreen,
  inDock,
  t,
}) {
  // ⚠️ REF ile okunur: init async ve MSAL ilk render'dan sonra oturaklaşabiliyor
  // (değer aşağıdaki layout effect'te her commit'te tazelenir).
  const startBadgeAllowedRef = useRef(false)
  // Konuşmanın NASIL kurulduğu, bir sonraki gerçek cevaba iliştirilmek üzere bekler.
  const startBadgeRef = useRef(null)
  // Konuşmayı bırakıldığı yerden getir (24 saat, bkz. chatSession.js). `?reset=` bileşeni
  // remount ettiği için orada tasarım gereği temiz başlangıç alınır.
  const [restored] = useState(() => loadChatSession(initialAgentId))
  const [messages, setMessages] = useState(() => restored?.messages ?? [])
  // Ekrandaki satırların kaçı depodan geri geldi — "önceki konuşma" ayracını besler.
  const [restoredCount, setRestoredCount] = useState(() => restored?.messages.length ?? 0)
  // Besteciyi yalnız bot GERÇEKTEN yanıt üretirken kilitler (küre "thinking" yazarken de yanar).
  const [busy, setBusy] = useState(false)
  // Aynı mount içinde "yeni sohbet": init effect'ini yeniden çalıştırır.
  const [resetNonce, setResetNonce] = useState(0)
  const copilotClientRef = useRef(null)
  // Oynayan Copilot konuşması; dökümle saklanır ki ajanın bağlamı da devam etsin.
  const conversationIdRef = useRef(restored?.conversationId ?? null)
  // Kimlik ref'te; değişince kayıt effect'ini tetikleyen sayaç.
  const [conversationTick, setConversationTick] = useState(0)
  // Saklanan konuşmanın üstüne mi binildi + tek seferlik kurtarma (bkz. recoverFromDeadConversation).
  const resumedRef = useRef(false)
  const recoveringRef = useRef(false)
  const abortGenRef = useRef(0)
  // "İlk yanıt yavaş olabilir" bildirimi bu konuşmada gösterildi mi?
  const firstReplyNoticeRef = useRef(false)
  // Hazır kapısı: init tamamen bitene kadar resolve olmaz; handleSend bunu bekler.
  const conversationReadyRef = useRef(Promise.resolve())
  const scroll = useChatScroll({ messages, onScreen })

  // Work IQ onayı: consentPrompt özet-onay kutusu ({ name, card, gen } | null), consentWait
  // otomatik onay overlay'i, autoConsentRef bu konuşmadaki karar (null / true / false).
  const [consentPrompt, setConsentPrompt] = useState(null)
  const [consentWait, setConsentWait] = useState(false)
  const autoConsentRef = useRef(null)
  const notifier = useAnswerNotification(onScreen)

  // Başka bir yüzeyden park edilmiş soru + gün özeti akışı (bkz. useParkedAsk).
  const sendRef = useRef(null)
  const { briefIntentRef, briefAdoptedRef, briefPending, setBriefPending } = useParkedAsk({
    onScreen,
    agents,
    catalogSettled,
    agent,
    setAgent,
    conversationReadyRef,
    sendRef,
  })

  const refs = {
    abortGenRef,
    copilotClientRef,
    startBadgeRef,
    startBadgeAllowedRef,
    autoConsentRef,
    conversationReadyRef,
    resumedRef,
    recoveringRef,
    conversationIdRef,
    firstReplyNoticeRef,
    briefIntentRef,
    briefAdoptedRef,
  }
  const setters = {
    setMessages,
    setOrbState,
    setBusy,
    setConsentPrompt,
    setConsentWait,
    setRestoredCount,
    setConversationTick,
    setResetNonce,
    setBriefPending,
    setIsNearBottom: scroll.setIsNearBottom,
    setInput,
  }
  // Motorun girdisi her render'da toplanır; motor commit'te kurulur (aşağıda) ki işleyiciler
  // eskisi gibi en son render'ın değerlerini okusun.
  const engineInput = {
    port: copilotPort,
    agent,
    input,
    t,
    inDock,
    schemaName,
    consentPrompt,
    resolveOpenAgent,
    notifier,
    refs,
    setters,
    effects: {
      isOffline: () => typeof navigator !== "undefined" && navigator.onLine === false,
      notifyOffline: () => notify.error(t("offline.chat")),
      showFirstReplyToast,
      chatFailureMessage,
      textWithStagedFiles,
      openUrl: (url) => window.open(url, "_blank", "noopener,noreferrer"),
    },
  }

  // Balonlara ve besteciye giden geri çağırımlar: kimliği sabit, gövdesi güncel. ChatMessage
  // memo'lu; her render'da yeni fonksiyon her token'da tüm listeyi yeniden çizdirirdi.
  // Layout effect'te kurulur: tıklama commit'ten sonra geldiği ve init/park effect'leri
  // layout effect'lerden sonra koştuğu için hiçbiri bir render geride kalmaz.
  const engineRef = useRef(null)
  useLayoutEffect(() => {
    startBadgeAllowedRef.current = startBadgeAllowed
    engineRef.current = createTurnEngine(engineInput)
    // Park edilmiş soru effect'i en taze handleSend'e ref üzerinden ulaşır.
    sendRef.current = (picked, text, card) => engineRef.current.handleSend(picked, text, card)
  })
  const handleSend = useCallback(
    (picked, text, card) => engineRef.current?.handleSend(picked, text, card),
    [],
  )
  const approveConsent = useCallback(() => engineRef.current?.approveConsent(), [])
  const rejectConsent = useCallback(() => engineRef.current?.rejectConsent(), [])
  const onRetry = useCallback((message) => engineRef.current?.handleRetry(message), [])
  const onSuggestedAction = useCallback(
    (action) => engineRef.current?.handleSuggestedAction(action),
    [],
  )
  const onCardAction = useCallback(
    (actionData) => engineRef.current?.handleCardAction(actionData),
    [],
  )

  // Dökümü + devam ettirilecek konuşmayı sakla (geri gezinme ve 24 saatlik devam için).
  useEffect(() => {
    scheduleChatSessionSave(agent, {
      conversationId: conversationIdRef.current,
      messages,
    })
  }, [messages, agent, conversationTick])

  // Asistan değişince (ya da ilk yüklemede) konuşmayı kur ve selamlamayı göster.
  useEffect(() => {
    if (!schemaName || schemaName === "agent-id") return
    copilotClientRef.current = null
    const gen = ++abortGenRef.current
    let resolveReady
    conversationReadyRef.current = new Promise((r) => {
      resolveReady = r
    })
    initConversation(
      {
        port: copilotPort,
        agent,
        schemaName,
        gen,
        notifier,
        refs,
        setters,
        streamReply: engineRef.current.streamReply,
      },
      resolveReady,
    )
    // schemaName: katalog async yüklenince init'in tetiklenmesi için şart.
    // resetNonce: header "yeni sohbet" ile aynı mount'ta yeniden başlatma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, schemaName, resetNonce])

  // "Yeni sohbet": saklanan döküm VE kimlik birlikte atılır (kimlik kalsa init temizlenen
  // sohbeti hemen ajanın hafızasına geri bağlardı); init resetNonce ile yeniden çalışır.
  function resetConversation() {
    clearChatSession(agent)
    conversationIdRef.current = null
    setRestoredCount(0)
    setResetNonce((n) => n + 1)
  }

  return {
    messages,
    restoredCount,
    busy,
    consentPrompt,
    consentWait,
    briefPending,
    scroll,
    handleSend,
    approveConsent,
    rejectConsent,
    onRetry,
    onSuggestedAction,
    onCardAction,
    resetConversation,
  }
}
