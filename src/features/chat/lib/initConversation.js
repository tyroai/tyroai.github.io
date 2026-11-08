import { extractSubmitActions } from "@/features/chat/consentCards"
import { foldActivityStep } from "@/lib/toolTracePolicy"
import { makeId } from "@/features/chat/lib/makeId"
import { adoptWarmConversation } from "./warmAdopt"

/**
 * Isınma sürerken sohbet açılırsa devralmak için beklenecek AZAMİ süre. Isıtma turunun
 * sahadaki medyanı 16,5 sn; 8 sn "bitmek üzereyse bekle" ile "kullanıcıyı bekletme" dengesi.
 */
export const WARM_ADOPT_WAIT_MS = 8000

/**
 * Konuşmayı kurar: kayıtlı oturumu devam ettir → olmazsa ısıtılmışı devral → olmazsa sıfırdan
 * el sıkış; selamlamayı gösterir ve selamlama kartının ilk Action.Submit'ini otomatik gönderir.
 * Sonunda (başarı/abort/hata) `resolveReady` çağrılır ki handleSend sonsuza kadar beklemesin.
 *
 * ctx: { port, agent, schemaName, gen, notifier, refs, setters, streamReply }
 * port: resumeConversation, startConversation, sendAction, readConversationId,
 *   awaitWarmConversation, markConversationLive, markConversationCold, peekWarmBrief,
 *   subscribeWarm, loadChatSession, markBriefUsed, dailyBrief.
 */
export async function initConversation(ctx, resolveReady) {
  const { port, agent, schemaName, gen, refs, setters } = ctx
  const { setMessages, setOrbState, setBusy } = setters
  const stale = () => refs.abortGenRef.current !== gen
  // Isınma durumu yalan söylemesin: eski konuşma bırakıldı, yenisi henüz kurulmadı.
  port.markConversationCold(schemaName)
  const greetingId = makeId()
  const greetingStartedAt = Date.now()
  // Yeni konuşmada Work IQ onay kararını ve overlay'leri sıfırla.
  refs.autoConsentRef.current = null
  refs.firstReplyNoticeRef.current = false
  setters.setConsentPrompt(null)
  setters.setConsentWait(false)
  // Init boyunca besteci kilitli: yoksa init'in yanıtı kullanıcının mesajından sonra düşer.
  setBusy(true)
  setOrbState("thinking")

  // Bu asistanın son 24 saatteki dökümü — asistan değişiminde de okunur.
  const saved = port.loadChatSession(agent)
  const hadPriorSession = !!saved?.messages.length

  // ⚠️ ÖZET DÜĞMESİ KAYITLI OTURUMU EZER — ama YALNIZ o düğme: "Sohbet" dünkü dökümü açar,
  // "Sabah özeti" temiz konuşmada hazır özeti. Dünkü döküm silinmez, yalnız bu açılışta çizilmez.
  const briefWanted = refs.briefIntentRef.current
  const briefPendingNow = !!briefWanted && refs.briefAdoptedRef.current !== briefWanted
  const briefReady = briefPendingNow && !!port.peekWarmBrief(schemaName)
  // Ölü konuşmadan kurtarma: kimliği yok say ve ekrandaki mesajlara DOKUNMA (depodaki
  // snapshot debounce yüzünden az önceki soruyu henüz içermeyebilir).
  const recovering = refs.recoveringRef.current
  refs.recoveringRef.current = false
  const resumeId = recovering || briefReady ? null : (saved?.conversationId ?? null)
  refs.conversationIdRef.current = resumeId
  setters.setConversationTick((n) => n + 1)
  if (recovering) {
    // ekrandaki döküm olduğu gibi kalır
  } else if (hadPriorSession && !briefReady) {
    setters.setRestoredCount(saved.messages.length)
    setMessages(saved.messages)
  } else {
    setters.setRestoredCount(0)
    // Sıfırdan: eski mesajları temizle, tek bir selamlama balonu göster.
    setMessages([
      {
        id: greetingId,
        role: "assistant",
        agent,
        content: "",
        attachments: [],
        time: new Date(),
        activity: { received: false, steps: [], startedAt: greetingStartedAt },
      },
    ])
  }

  let greetingText = ""
  let greetingAttachments = []
  let greetingSuggested = []
  let copilotClient = null
  try {
    // Önce kaldığı yerden devam: başarılıysa selamlama da otomatik menü turu da atlanır.
    let resumed = false
    if (resumeId) {
      try {
        copilotClient = await port.resumeConversation(schemaName, resumeId)
        if (stale()) return
        refs.copilotClientRef.current = { client: copilotClient, agentId: agent }
        port.markConversationLive(schemaName)
        resumed = true
        // Ölçülecek süre yok: resumeConversation ağa çıkmıyor; rozet bunu cümleyle söyler.
        refs.startBadgeRef.current = refs.startBadgeAllowedRef.current
          ? { kind: "resumed", handshakeMs: null, warmTurnMs: null }
          : null
      } catch (err) {
        // Bağlanma ağa çıkmıyor; buraya ancak token alınamazsa düşülür. Sıfırdan kur.
        console.debug("Copilot resume failed, starting fresh:", err)
        refs.conversationIdRef.current = null
        setters.setConversationTick((n) => n + 1)
      }
      if (stale()) return
    }
    refs.resumedRef.current = resumed

    // Döküm geri geldiyse selamlama gösterilmez (canlı yanıt gibi okunurdu).
    const showGreeting = (!hadPriorSession || briefReady) && !recovering

    // ⚠️ Isıtılmış konuşma yalnız `resumed` DEĞİLKEN devralınır: kayıtlı konuşma kullanıcının
    // gerçek dökümüdür. Isınma sürüyorsa kısa süre beklenir (sıfırdan kurmak MCP'yi yeniden ödetir).
    let warmAdopted = false
    if (!resumed) {
      const warmed = await port.awaitWarmConversation(schemaName, WARM_ADOPT_WAIT_MS)
      if (warmed) {
        warmAdopted = true
        resumed = true
        const adopted = await adoptWarmConversation(ctx, warmed, {
          greetingId,
          showGreeting,
          briefWanted,
        })
        copilotClient = adopted.client
        greetingText = adopted.greeting.text
        greetingAttachments = adopted.greeting.attachments
        greetingSuggested = adopted.greeting.suggestedActions
      }
    }

    if (!resumed) {
      // Sıfırdan kurulum: rozetin "cold" balonundaki el sıkışma süresi burada ölçülür.
      const coldStartedAt = performance.now()
      for await (const chunk of port.startConversation(schemaName)) {
        if (stale()) return
        if (chunk.done) {
          copilotClient = chunk.client
          refs.copilotClientRef.current = { client: copilotClient, agentId: agent }
          port.markConversationLive(schemaName)
          refs.conversationIdRef.current =
            chunk.conversationId ?? port.readConversationId(copilotClient)
          setters.setConversationTick((n) => n + 1)
          refs.startBadgeRef.current = refs.startBadgeAllowedRef.current
            ? {
                kind: "cold",
                handshakeMs: Math.round(performance.now() - coldStartedAt),
                warmTurnMs: null,
              }
            : null
          break
        }
        // Geçici "Processing…" selamlamaya basılmaz; ajanın sözü ize düşer.
        if (chunk.transient) {
          if (showGreeting) {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === greetingId
                  ? {
                      ...msg,
                      activity: foldActivityStep(msg.activity, chunk.text, greetingStartedAt),
                    }
                  : msg,
              ),
            )
          }
          continue
        }
        greetingText = chunk.text
        if (chunk.attachments?.length) greetingAttachments = chunk.attachments
        if (chunk.suggestedActions?.length) greetingSuggested = chunk.suggestedActions
        if (!showGreeting) continue
        setMessages((m) =>
          m.map((msg) =>
            msg.id === greetingId
              ? {
                  ...msg,
                  content: greetingText,
                  attachments: greetingAttachments,
                  suggestedActions: greetingSuggested,
                }
              : msg,
          ),
        )
      }
      if (stale()) return
      if (
        showGreeting &&
        !greetingText &&
        !greetingAttachments.length &&
        !greetingSuggested.length
      ) {
        setMessages((m) => m.filter((msg) => msg.id !== greetingId))
      }
    }

    // Selamlama kartındaki ilk Action.Submit'i otomatik gönder (menüyü göster). Gerçekten devam
    // ettirilen konuşmada menü zaten dökümde; ısıtılmışta gönderilir (ısıtma yalnız el sıkışmayı
    // ödedi). Özet istendiyse gönderilmez: alakasız menü düşürür ya da canlı özeti bekletir.
    if (
      showGreeting &&
      (!resumed || warmAdopted) &&
      !briefPendingNow &&
      copilotClient &&
      greetingAttachments.length
    ) {
      const firstCard = greetingAttachments.find(
        (a) => a.contentType === "application/vnd.microsoft.card.adaptive",
      )
      if (firstCard?.content) {
        const actions = extractSubmitActions(firstCard.content.body || [])
        const firstAction = actions.find((a) => a.style === "positive") || actions[0]
        if (firstAction) {
          await ctx.streamReply(port.sendAction(copilotClient, firstAction.data ?? {}), gen)
        }
      }
    }
  } catch (err) {
    console.error("Copilot init error:", err)
  } finally {
    resolveReady()
    if (!stale()) {
      setBusy(false)
      setOrbState((s) => (s === "thinking" ? "idle" : s))
    }
  }
}
