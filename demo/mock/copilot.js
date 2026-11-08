// Sahte Copilot Studio asistanı: veri setindeki senaryodan (assistant.answers) yanıt üretir.
// Gerçek akışı taklit eder: ara "bilgi" adımları → büyüyen metin parçaları → TEK nihai mesaj
// (spec: scratchpad/spec-dataverse.md §4). Ağ isteği yapmaz.
import { fold } from "./graph-util.js"
import { localizeDays } from "../time.js"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

const GENERIC = [
  {
    match: "merhaba|selam|günaydın|iyi akşamlar|hello|hi\\b",
    text: "Merhaba! Size nasıl yardımcı olabilirim?",
  },
  {
    match: "teşekkür|sağ ol|sagol|thanks",
    text: "Rica ederim, başka bir konuda yardımcı olabilirsem söyle.",
  },
  {
    match: "neler yapabilirsin|ne yapabilirsin|yapabilirsin|araç|yardım|help",
    text: "Şunlarda yardımcı olabilirim:\n\n- Satış hedefi, fırsat ve ekip performansı soruları\n- Takvim, izin ve masraf işlemleri\n- Haftalık özet ve rapor hazırlama\n\nBir şey yazman yeterli.",
  },
]

function pickAnswer(ds, text) {
  const folded = fold(text)
  const list = [...(ds.assistant?.answers ?? []), ...GENERIC]
  for (const a of list) {
    try {
      if (new RegExp(fold(a.match), "i").test(folded)) return a
    } catch {
      /* geçersiz kalıp: atla */
    }
  }
  return {
    text:
      ds.assistant?.fallback ??
      "Bunu tam anlayamadım ama yardımcı olmak isterim. Biraz daha ayrıntı verir misin?",
  }
}

const actionsOf = (chips = []) => chips.map((c) => ({ type: "imBack", title: c, value: c }))

function messageActivity(text, chips, conversationId, extra = {}) {
  return {
    type: "message",
    id: uuid(),
    text,
    conversation: { id: conversationId },
    suggestedActions: { actions: actionsOf(chips) },
    ...extra,
  }
}

const streamInfo = (streamType, seq) => [{ type: "streaminfo", streamType, streamSequence: seq }]

/** Metni kelime kelime büyüyen, kümülatif parçalara böl. */
function growing(text, steps = 7) {
  const words = text.split(/(\s+)/)
  const out = []
  const per = Math.max(1, Math.ceil(words.length / steps))
  let acc = ""
  for (let i = 0; i < words.length; i += per) {
    acc += words.slice(i, i + per).join("")
    if (acc.length < text.length) out.push(acc)
  }
  return out
}

function agentPersona(ds, schemaName) {
  const a = ds.assistant ?? {}
  if (/sales/i.test(schemaName ?? "")) return a.sales ?? a.office ?? {}
  return a.office ?? {}
}

/** Fiş okuyucu: yapılandırılmış tek JSON nesnesi döner (self-service masraf formu). */
function receiptReply() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const p = (n) => String(n).padStart(2, "0")
  return JSON.stringify({
    kind: "receipt",
    total: 450,
    totalEvidence: "TOPLAM *450,00",
    currency: "TRY",
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    firm: "Örnek Lokanta",
    receiptNo: "000412",
    categoryHint: "food",
  })
}

export class FakeCopilotClient {
  constructor(settings) {
    this.settings = settings
    this.conversationId = ""
  }

  get ds() {
    return window.__DEMO__?.dataset ?? {}
  }

  async *startConversationStreaming() {
    this.conversationId = `demo-${uuid()}`
    const persona = agentPersona(this.ds, this.settings?.schemaName)
    if (/VoucherReader/i.test(this.settings?.schemaName ?? "")) return
    const greeting = persona.greeting ?? "Merhaba! Size nasıl yardımcı olabilirim?"
    await sleep(350)
    yield messageActivity(greeting, persona.chips, this.conversationId, { entities: streamInfo("final", 1) })
  }

  async *sendActivityStreaming(activity) {
    const id = this.conversationId || `demo-${uuid()}`
    this.conversationId = id
    const schema = this.settings?.schemaName ?? ""
    const text = String(activity?.text ?? "")

    if (/VoucherReader/i.test(schema)) {
      await sleep(900)
      yield messageActivity(receiptReply(), [], id, { entities: streamInfo("final", 1) })
      return
    }

    let reply
    if (activity?.attachments?.length) {
      reply = { text: `Dosyanı aldım: **${activity.attachments[0].name ?? "ek"}**. İçeriğine göre ne yapmamı istersin?` }
    } else if (!text && activity?.value) {
      reply = { text: "Tamam, bilgilerini aldım ve işleme aldım." }
    } else {
      reply = pickAnswer(this.ds, text)
    }

    reply = { ...reply, text: localizeDays(reply.text) }

    // 1) ara bilgi adımları
    let seq = 1
    for (const step of reply.steps ?? []) {
      await sleep(420)
      yield { type: "typing", text: step, conversation: { id }, entities: streamInfo("informative", seq++) }
    }
    // 2) büyüyen metin
    await sleep(250)
    for (const part of growing(reply.text)) {
      yield { type: "typing", text: part, conversation: { id }, entities: streamInfo("streaming", seq++) }
      await sleep(70)
    }
    // 3) tek nihai mesaj
    yield messageActivity(reply.text, reply.chips, id, { entities: streamInfo("final", seq) })
  }
}
