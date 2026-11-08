import { makeId } from "@/features/chat/lib/makeId"

/**
 * Ön-ısıtılmış konuşmayı devralır (bkz. lib/warmStart.js): hazır client'ı ve selamlamayı
 * olduğu gibi alır, ağa çıkmaz. Kullanıcı "Sabah özeti"ne bastıysa hazırlanmış özeti de
 * ekrana basar. `initConversation`ın parçası; aynı ctx'i paylaşır.
 *
 * @returns {Promise<{ client, greeting: { text, attachments, suggestedActions } }>}
 */
export async function adoptWarmConversation(
  ctx,
  warmed,
  { greetingId, showGreeting, briefWanted },
) {
  const { port, agent, schemaName, refs, setters } = ctx
  const { setMessages } = setters
  const client = warmed.client
  refs.copilotClientRef.current = { client, agentId: agent }
  port.markConversationLive(schemaName)
  refs.conversationIdRef.current = warmed.conversationId
  setters.setConversationTick((n) => n + 1)
  const greeting = {
    text: warmed.greeting.text,
    attachments: warmed.greeting.attachments,
    suggestedActions: warmed.greeting.suggestedActions,
  }
  // ⚠️ ISITMA ROZETİ MESAJ DEĞİL, İŞARET: ısıtma turu döküme yazılmaz (kullanıcının sormadığı
  // soru konuşmayı yalan söyletir); ölçü bir sonraki GERÇEK cevabın eylem satırına iliştirilir.
  refs.startBadgeRef.current = refs.startBadgeAllowedRef.current
    ? { kind: "warm", ...(warmed.warm ?? { handshakeMs: null, warmTurnMs: null }) }
    : null
  if (
    showGreeting &&
    (greeting.text || greeting.attachments.length || greeting.suggestedActions.length)
  ) {
    setMessages((m) =>
      m.map((msg) =>
        msg.id === greetingId
          ? {
              ...msg,
              content: greeting.text,
              attachments: greeting.attachments,
              suggestedActions: greeting.suggestedActions,
            }
          : msg,
      ),
    )
  } else if (showGreeting) {
    setMessages((m) => m.filter((msg) => msg.id !== greetingId))
  }

  // ── GÜN ÖZETİ: "ısıtma sohbete yazılmaz" kuralının TEK istisnası, koşulu düğmeye basılmış
  // olması. Tazelik tavanı aşan tampon etiketlenmez, düşürülür; metinsiz düşmüş tur basılmaz
  // (ikisi de park salıvermede canlı gönderilir).
  const brief = warmed.brief
  if (
    brief &&
    briefWanted &&
    refs.briefAdoptedRef.current !== briefWanted &&
    Date.now() - brief.startedAt <= port.dailyBrief.freshMs &&
    !(brief.state === "failed" && !brief.text)
  ) {
    await showBrief(ctx, brief, briefWanted, warmed.turnPromise)
  }
  return { client, greeting }
}

async function showBrief(ctx, brief, briefWanted, turnPromise) {
  const { port, agent, refs, setters, notifier } = ctx
  const { setMessages, setOrbState } = setters
  refs.briefAdoptedRef.current = briefWanted
  // Damga tam burada "kullanıldı" olur: basılmadan yenilenen özet kaybolur ve pencerenin bir
  // deneme hakkı daha kalmalı (bkz. DAILY_BRIEF.maxArms).
  port.markBriefUsed(briefWanted)
  const askId = makeId()
  const ansId = makeId()
  setMessages((m) => [
    ...m,
    {
      id: askId,
      role: "user",
      content: brief.question,
      attachments: [],
      // Soru GERÇEKTEN o an gitti — saat uydurulmuyor.
      time: new Date(brief.startedAt),
    },
    {
      id: ansId,
      role: "assistant",
      agent,
      content: brief.text,
      attachments: brief.attachments,
      suggestedActions: brief.suggestedActions,
      time: new Date(),
      activity: brief.activity,
      // Rozet BU balona: özet, bu konuşmanın ilk gerçek cevabı.
      start: refs.startBadgeRef.current,
    },
  ])
  setters.setBriefPending(null)
  refs.startBadgeRef.current = null

  if (brief.state !== "running") return
  // Tur hâlâ akıyor: busy/küre init'in kendi kilidiyle yönetiliyor; burada beklemek ilerleme
  // arayüzünü ve hazır kapısını bedava doğru yapar.
  notifier.armTurn(brief.question)
  const unsub = port.subscribeWarm(() =>
    setMessages((m) =>
      m.map((msg) =>
        msg.id === ansId
          ? {
              ...msg,
              content: brief.text,
              attachments: brief.attachments,
              suggestedActions: brief.suggestedActions,
              activity: brief.activity,
            }
          : msg,
      ),
    ),
  )
  let capped = false
  await Promise.race([
    turnPromise?.catch(() => {}) ?? Promise.resolve(),
    new Promise((r) =>
      setTimeout(() => {
        capped = true
        r()
      }, port.dailyBrief.streamCapMs),
    ),
  ])
  unsub()
  const failed = capped || brief.state === "failed"
  notifier.resolveTurn({ answer: brief.text, failed })
  if (failed) {
    // Yarım özeti tam cevap gibi göstermek yalan olur: "tamamlanmadı" + Tekrar dene.
    setMessages((m) =>
      m.map((msg) =>
        msg.id === ansId
          ? { ...msg, incomplete: true, retry: { kind: "message", text: brief.question } }
          : msg,
      ),
    )
  } else {
    setOrbState("speaking")
    setTimeout(() => setOrbState("idle"), 2400)
  }
}
