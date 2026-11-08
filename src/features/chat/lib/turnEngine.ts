import { consentActionData, consentName, findConsentCard } from "@/features/chat/consentCards"
import { makeId } from "@/features/chat/lib/makeId"
import { streamReply as consumeStream } from "./streamReply"
import type {
  Completed,
  ConsentCard,
  CopilotClient,
  PickedFile,
  TurnContext,
  TurnSpec,
} from "@/features/chat/lib/turnTypes"
import type { ChatMessage, RetryDescriptor, StreamChunk, SuggestedAction } from "./streamReply"

export type * from "@/features/chat/lib/turnTypes"

// "Asistan çalışıyor" bildiriminin ekranda kalma süresi: iki cümleyi okumaya yeter.
const FIRST_REPLY_NOTICE_MS = 6_000
// Biten cevaptan sonra kürenin "konuşuyor" kalma süresi.
const SPEAK_MS = 2400

/**
 * Sohbet turu motoru: gönder, öneri/kart eylemi, tekrar dene, Work IQ onay döngüsü ve ölü
 * konuşmadan kurtarma. React'e bağlı değil — durum `setters` ile, Copilot `port` ile gelir;
 * `useChatTurn` her render'da yeniden kurar (eski ChatScreen'deki gibi işleyiciler en son
 * render'ın değerlerini okur). Port, refs, setters ve effects: `TurnContext`.
 */
export function createTurnEngine(ctx: TurnContext) {
  const { port, agent, t, notifier, refs, setters, effects } = ctx
  const { setMessages, setOrbState, setBusy, setConsentPrompt, setConsentWait } = setters
  const isCurrent = (gen: number) => () => refs.abortGenRef.current === gen

  function speakBriefly() {
    setOrbState("speaking")
    setTimeout(() => setOrbState("idle"), SPEAK_MS)
  }

  // Konuşmanın nasıl kurulduğunu söyleyen rozet TEK SEFERLİK: ilk akan tura iliştirilir
  // (selamlama kartının otomatik turu dahil — MCP başlatmasını gerçekten o öder).
  function streamReply(generator: AsyncIterable<StreamChunk>, gen: number) {
    const startBadge = refs.startBadgeRef.current
    refs.startBadgeRef.current = null
    return consumeStream(generator, { agent, isCurrent: isCurrent(gen), setMessages, startBadge })
  }

  // Akış sonrası ortak son-iş: yarıda kesildiyse balonu "eksik" işaretle (Tekrar dene
  // tarifiyle), yoksa küreyi kısa süre "speaking"e al. Bildirici için tek huni.
  function finishStream(res: Completed, retryDescriptor: RetryDescriptor) {
    notifier.resolveTurn({ answer: res.fullText, failed: !!res.incomplete })
    if (res.incomplete) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === res.replyId ? { ...msg, incomplete: true, retry: retryDescriptor } : msg,
        ),
      )
      setOrbState("idle")
    } else {
      speakBriefly()
    }
  }

  // Sonuç consent kartıysa akışı devralır; true dönerse çağıran finishStream'i atlamalı.
  async function maybeHandleConsent(res: Completed, gen: number) {
    const card = findConsentCard(res?.fullAttachments)
    if (!card) return false
    // Ham consent balonunu gizle — kendi kutumuz/otomatik akışımız yönetecek.
    if (res.replyId) setMessages((m) => m.filter((msg) => msg.id !== res.replyId))
    const client = refs.copilotClientRef.current?.client
    if (!client) return true
    if (refs.autoConsentRef.current === true) {
      await runConsentLoop(client, card, gen)
    } else if (refs.autoConsentRef.current === false) {
      // Daha önce reddedildi → sessizce iptal; bekleyen tur sonrakinin bildirimine karışmasın.
      notifier.cancelTurn()
      await streamReply(port.sendAction(client, consentActionData(card, "Cancel")), gen)
    } else {
      setConsentPrompt({ name: consentName(card), card, gen })
    }
    return true
  }

  // Onaydan sonra gelen HER consent kartını "Allow"lar; consent olmayan nihai yanıtın
  // balonunu bırakıp döngüyü bitirir.
  async function runConsentLoop(client: CopilotClient, firstCard: ConsentCard, gen: number) {
    setConsentWait(true)
    setBusy(true)
    try {
      let card: ConsentCard | null = firstCard
      let lastRes: Completed | null = null
      while (card) {
        const res = await streamReply(
          port.sendAction(client, consentActionData(card, "Allow")),
          gen,
        )
        if (res.aborted) {
          notifier.cancelTurn()
          return
        }
        lastRes = res
        const next = findConsentCard(res.fullAttachments)
        if (next) {
          if (res.replyId) setMessages((m) => m.filter((msg) => msg.id !== res.replyId))
          card = next
        } else {
          card = null
        }
      }
      if (lastRes) finishStream(lastRes, { kind: "action", actionData: {} })
    } finally {
      setConsentWait(false)
      if (refs.abortGenRef.current === gen) setBusy(false)
    }
  }

  // Özet kutu "Evet, hepsine izin ver".
  async function approveConsent() {
    const p = ctx.consentPrompt
    setConsentPrompt(null)
    if (!p) return
    refs.autoConsentRef.current = true
    const client = refs.copilotClientRef.current?.client
    if (client) await runConsentLoop(client, p.card, p.gen)
  }

  // Özet kutu "Hayır": bu bağlantıyı iptal et, otomatik onayı kapat.
  async function rejectConsent() {
    const p = ctx.consentPrompt
    setConsentPrompt(null)
    if (!p) return
    refs.autoConsentRef.current = false
    const client = refs.copilotClientRef.current?.client
    if (!client) return
    const gen = ++refs.abortGenRef.current
    setBusy(true)
    try {
      const res = await streamReply(
        port.sendAction(client, consentActionData(p.card, "Cancel")),
        gen,
      )
      if (!res.aborted) finishStream(res, { kind: "action", actionData: {} })
    } finally {
      if (refs.abortGenRef.current === gen) setBusy(false)
    }
  }

  /**
   * Devam ettirilen konuşmada tur düşünce bir kez: kimliği at ve sıfırdan el sıkış.
   * Sessiz yeniden gönderim DEĞİL — ajan akış kopmadan bir işlem yapmış olabilir.
   */
  function recoverFromDeadConversation() {
    if (!refs.resumedRef.current) return
    refs.resumedRef.current = false
    refs.recoveringRef.current = true
    refs.conversationIdRef.current = null
    setters.setConversationTick((n) => n + 1)
    setters.setResetNonce((n) => n + 1)
  }

  // Kullanıcı turunun ortak iskeleti: hazır kapısı → yeni gen → akış → consent → son-iş.
  async function runTurn({
    before,
    makeGenerator,
    armText,
    retry,
    label,
    recover = false,
  }: TurnSpec) {
    await refs.conversationReadyRef.current
    const client = refs.copilotClientRef.current?.client
    if (!client) return
    before?.()
    const gen = ++refs.abortGenRef.current
    try {
      const generator = makeGenerator(client)
      notifier.armTurn(armText)
      const res = await streamReply(generator, gen)
      if (res.aborted) {
        notifier.cancelTurn()
        return
      }
      if (await maybeHandleConsent(res, gen)) return
      finishStream(res, retry)
    } catch (err) {
      console.error(label, err)
      notifier.resolveTurn({ failed: true })
      setOrbState("idle")
      if (recover) recoverFromDeadConversation()
    } finally {
      if (refs.abortGenRef.current === gen) setBusy(false)
    }
  }

  // "Tekrar dene": eski yarım balonu kaldırıp aynı turu temiz bir akışla yeniden gönderir.
  async function handleRetry(message: ChatMessage | null | undefined) {
    if (!message?.retry) return
    const r = message.retry
    await runTurn({
      before: () => {
        setMessages((m) => m.filter((msg) => msg.id !== message.id))
        setters.setIsNearBottom(true)
        setOrbState("thinking")
        setBusy(true)
      },
      makeGenerator: (client) =>
        r.kind === "action"
          ? port.sendAction(client, r.actionData ?? {})
          : port.sendMessage(client, String(r.text ?? "")),
      armText: r.kind === "message" ? r.text : "",
      retry: r,
      label: "Retry error:",
    })
  }

  // Öneri çipi: imBack/messageBack → mesaj, postBack → eylem, openUrl → yeni sekme.
  async function handleSuggestedAction(action: SuggestedAction) {
    const { kind, payload } = port.resolveSuggestedAction(action)
    if (kind === "url") {
      if (payload) effects.openUrl(payload)
      return
    }
    const actionData = typeof payload === "object" ? payload : { value: payload }
    await runTurn({
      before: () => {
        setters.setIsNearBottom(true)
        setMessages((m) => [
          ...m,
          { id: makeId(), role: "user", content: action.title, time: new Date() },
        ])
        setOrbState("thinking")
        setBusy(true)
      },
      makeGenerator: (client) =>
        kind === "action"
          ? port.sendAction(client, actionData)
          : port.sendMessage(client, String(payload)),
      armText: action.title,
      retry:
        kind === "action"
          ? { kind: "action", actionData }
          : { kind: "message", text: String(payload) },
      label: "Suggested action error:",
      recover: true,
    })
  }

  async function handleCardAction(actionData: unknown) {
    await runTurn({
      before: () => {
        setOrbState("thinking")
        setBusy(true)
      },
      makeGenerator: (client) => port.sendAction(client, actionData),
      armText: "",
      retry: { kind: "action", actionData },
      label: "Card action error:",
      recover: true,
    })
  }

  /**
   * Kullanıcı mesajı. `overrideText` besteciden geçmemiş sorular için (header panelleri,
   * park edilmiş soru): state'e yazıp çağırmak bayat closure değerini okurdu.
   */
  async function handleSend(
    picked: PickedFile[] = [],
    overrideText?: string,
    card: object | null = null,
  ) {
    const text = (overrideText ?? ctx.input).trim()
    if (!text && picked.length === 0) return
    // Çevrimdışıyken dürüst reddet: balon eklenmez, metin bestecide kalır.
    if (effects.isOffline()) {
      effects.notifyOffline()
      return
    }
    // Balonda yalnız görüntüleme metası (ad/boyut/tip): mesajlar localStorage'a yansıyor,
    // base64 data-URI'ler kotayı patlatır.
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      attachments: picked.map((a) => ({ name: a.name, size: a.size, contentType: a.type })),
      time: new Date(),
      // Formdan gelen talep: balon yerine kart (`RequestCard`); asistana giden metin aynı.
      ...(card && { card }),
    }
    setters.setIsNearBottom(true)
    setMessages((m) => [...m, userMsg])
    setters.setInput("")
    setOrbState("thinking")
    setBusy(true)

    // İlk kullanıcı mesajında Copilot konuşması kuruluyor ve ilk yanıt yavaş; bir kez söyle.
    // Yapılandırılmamış (mock) asistanda gerek yok.
    const renderSchema = ctx.schemaName
    if (!refs.firstReplyNoticeRef.current && renderSchema && renderSchema !== "agent-id") {
      refs.firstReplyNoticeRef.current = true
      effects.showFirstReplyToast({ t, inDock: ctx.inDock, duration: FIRST_REPLY_NOTICE_MS })
    }

    // KRİTİK: init (selamlama + otomatik tur) bitene kadar bekle; gen'i önce artırmak init'in
    // turunu kesip aynı konuşmaya çakışan tur gönderirdi ("Sohbet durduruldu").
    await refs.conversationReadyRef.current

    const gen = ++refs.abortGenRef.current
    try {
      // Gönderim yolu da kilit süzgecinden geçer (bkz. ChatScreen resolveOpenAgent).
      const activeAgent = ctx.resolveOpenAgent(agent)
      const schemaName = activeAgent?.agentId

      if (!schemaName || schemaName === "agent-id") {
        // Asistan henüz yapılandırılmamış — mock cevap
        await new Promise((r) => setTimeout(r, 1000))
        if (refs.abortGenRef.current !== gen) return
        const replyText =
          activeAgent?.description?.trim() ||
          `${activeAgent?.name ?? "Agent"} — ${t("chat.subtitle.lead")} ${t("chat.subtitle.highlight")}`
        setMessages((m) => [
          ...m,
          { id: makeId(), role: "assistant", agent, content: replyText, time: new Date() },
        ])
        speakBriefly()
        return
      }

      // Hazır kapısından SONRA istemci yoksa başlatma bitmiş ve kurulamamış: beklemek bir
      // şey değiştirmez, yeni sohbet gerekir.
      if (!refs.copilotClientRef.current || refs.copilotClientRef.current.agentId !== agent) {
        setMessages((m) => [
          ...m,
          {
            id: makeId(),
            role: "assistant",
            agent,
            content: t(
              "chat.notReady",
              "Bu sohbet başlatılamadı. Sağ üstten yeni bir sohbet başlatıp tekrar dener misin?",
            ),
            attachments: [],
            time: new Date(),
          },
        ])
        setOrbState("idle")
        return
      }

      const client = refs.copilotClientRef.current.client
      // Dosyalar yalnız bu aktivite için data-URI'ye çevrilir (kalıcı değil).
      const wireAttachments = await port.filesToAttachments(picked.map((a) => a.file))
      // Masraf fişi: dosyanın kopyası HR MCP'ye, kimliği mesaja (features/chat/lib/chatFileStaging.js).
      const wireText = await effects.textWithStagedFiles(text, wireAttachments, activeAgent, t)
      // Turdan hemen önce işaretle: erken çıkışlarda bekleyen tur kalmasın.
      notifier.armTurn(text)
      const res = await streamReply(port.sendMessage(client, wireText, wireAttachments), gen)
      if (res.aborted) {
        notifier.cancelTurn()
        return
      }
      if (await maybeHandleConsent(res, gen)) return
      // Retry tarifi yalnız metin: base64 dosyalar saklanmadığı için ek yeniden gönderilemez.
      finishStream(res, { kind: "message", text })
    } catch (err) {
      if (refs.abortGenRef.current !== gen) return
      console.error("Copilot Studio error:", err)
      notifier.resolveTurn({ failed: true })
      // Süresi dolmuş konuşma ilk sendMessage'da patlar; aşağıdaki kurtarma onu tazelediği
      // için mesaj "tekrar dene" der (bkz. chatFailure.js).
      const failed = await effects.chatFailureMessage(t, err, agent)
      // Neden çözücüsü beklenirken sohbet sıfırlandıysa eski hata yeni sohbete düşmesin.
      if (refs.abortGenRef.current !== gen) return
      setMessages((m) => [...m, failed])
      setOrbState("idle")
      recoverFromDeadConversation()
    } finally {
      if (refs.abortGenRef.current === gen) setBusy(false)
    }
  }

  return {
    handleSend,
    streamReply,
    finishStream,
    maybeHandleConsent,
    approveConsent,
    rejectConsent,
    recoverFromDeadConversation,
    handleRetry,
    handleSuggestedAction,
    handleCardAction,
    isCurrent,
  }
}
