import { foldActivityStep, foldToolCall } from "@/lib/toolTracePolicy"
import { makeId } from "@/features/chat/lib/makeId"

/** Copilot'un önerdiği hızlı yanıt (Bot Framework `CardAction`); `title` çipin yazısı. */
export interface SuggestedAction {
  type?: string
  title: string
  value?: unknown
}

/** Akışın bir parçası (`lib/copilot` › `activityToChunk`); `{ done: true }` akışı bitirir. */
export type StreamChunk = { done: true } | ContentChunk

export interface ContentChunk {
  done?: false
  text: string
  streamType?: string | null
  /** Tamamlanmış "message" aktivitesi. */
  final?: boolean
  /** Geçici durum ("Arıyorum…"): balona değil ize. */
  transient?: boolean
  attachments?: unknown[]
  suggestedActions?: SuggestedAction[]
  /** Araç çağrısı olayı (`foldToolCall`). */
  tool?: unknown
  /** Aracın ürettiği belge; asistanın eklerinin yanına konur. */
  document?: unknown
}

/** Turun canlı hesabı (`AgentActivity`). `running`: çalışan aracın etiketi. */
export interface Activity {
  received: boolean
  steps: string[]
  startedAt: number
  running?: string | null
}

/** "Tekrar dene" tarifi: aynı tur metinle mi eylemle mi yeniden gönderilir. */
export type RetryDescriptor =
  { kind: "message"; text?: string } | { kind: "action"; actionData?: unknown }

/** Sohbet balonu. */
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  agent?: string
  content: string
  attachments?: unknown[]
  suggestedActions?: SuggestedAction[]
  time: Date
  /** Konuşmanın nasıl kurulduğunu söyleyen tek seferlik rozet. */
  start?: unknown
  activity?: Activity
  incomplete?: boolean
  retry?: RetryDescriptor
  /** Formdan gelen talebin kartı (`RequestCard`). */
  card?: unknown
}

/** React'in `setMessages`ı; yalnız güncelleyici biçimiyle çağrılır. */
export type SetMessages = (update: (messages: ChatMessage[]) => ChatMessage[]) => void

export interface StreamContext {
  agent: string
  /** Tur hâlâ güncel mi; değilse akış bırakılır. */
  isCurrent: () => boolean
  setMessages: SetMessages
  startBadge?: unknown
}

/** Akışın sonucu; tur güncelliğini yitirdiyse yalnız `{ aborted: true }`. */
export type StreamResult =
  | { aborted: true }
  | {
      aborted?: undefined
      fullText: string
      fullAttachments: unknown[]
      fullSuggested: SuggestedAction[]
      /** Final gelmeden bitti (Tekrar dene sunulur). */
      incomplete: boolean
      replyId: string
    }

/**
 * Bir Copilot generator'ını tüketir, tek bir asistan balonunu akış boyunca günceller
 * (metin + kartlar + suggestedActions). İçerik gelmezse balonu kaldırır. Tur artık güncel
 * değilse ({ isCurrent } false) `{ aborted: true }` döner. React'ten bağımsız: yalnız
 * `setMessages` güncelleyicisi ile konuşur, testler sahte generator ile çalıştırır.
 * `generator`: sendMessage/sendAction akışı.
 */
export async function streamReply(
  generator: AsyncIterable<StreamChunk>,
  { agent, isCurrent, setMessages, startBadge = null }: StreamContext,
): Promise<StreamResult> {
  const replyId = makeId()
  // `activity` turun canlı hesabı (bkz. AgentActivity): akış cevap verene kadar bildiğimiz
  // tek şey "gönderiliyor"; sonraki her değişiklik gelen bir aktiviteden doğar.
  const startedAt = Date.now()
  setMessages((m) => [
    ...m,
    {
      id: replyId,
      role: "assistant",
      agent,
      content: "",
      attachments: [],
      suggestedActions: [],
      time: new Date(),
      start: startBadge,
      activity: { received: false, steps: [], startedAt },
    },
  ])

  // Bu balonun izine tek bir güncelleme katlar, gerisine dokunmaz.
  const updateActivity = (fn: (a: Activity) => Activity) =>
    setMessages((m) =>
      m.map((msg) =>
        msg.id === replyId
          ? { ...msg, activity: fn(msg.activity ?? { received: false, steps: [], startedAt }) }
          : msg,
      ),
    )
  let fullText = ""
  let fullAttachments: unknown[] = []
  let fullSuggested: SuggestedAction[] = []
  // Tamamlanmış "message" aktivitesi görmeden akış biterse (iOS PWA'da bağlantı kopması)
  // yanıt yarıda kalmış demektir.
  let sawFinal = false
  // Yalnız geçici güncelleme görüp final gelmeden biten akış da "yarıda kesildi" sayılır
  // ki Tekrar dene sunulabilsin.
  let sawTransient = false
  // Araç çağrısı event'leri tur boyunca `planIdentifier` ile anahtarlanır (bkz. foldToolCall).
  const toolBuffer = new Map<unknown, unknown>()
  // Araçların ürettiği belgeler asistanın eklerinin YANINA konur, onları ezmez (bkz. botFiles).
  const docs: unknown[] = []
  for await (const chunk of generator) {
    if (!isCurrent()) return { aborted: true }
    if (chunk.done) break
    // Araç çağrısının metni yok: `foldActivityStep`e düşse boş adım eklemeye çalışırdı.
    if (chunk.document) docs.push(chunk.document)
    if (chunk.tool) {
      sawTransient = true
      const step = foldToolCall(toolBuffer, chunk.tool)
      if (step?.kind === "running") {
        // Çalışan araç başlıkta durur, ize düşmez: bitmemiş çağrıya tik koymak yalan olur.
        updateActivity((a) => ({
          ...(a ?? { received: false, steps: [], startedAt }),
          received: true,
          running: step.label,
        }))
      } else if (step?.kind === "done") {
        updateActivity((a) => foldActivityStep({ ...a, running: null }, step.label, startedAt))
      }
      continue
    }
    // Geçici durum güncellemesi balona yazılmaz, yalnız ize düşer ("yazıyor" kalsın).
    if (chunk.transient) {
      sawTransient = true
      updateActivity((a) => foldActivityStep(a, chunk.text, startedAt))
      continue
    }
    updateActivity((a) => (a.received ? a : { ...a, received: true }))
    if (chunk.final) sawFinal = true
    fullText = chunk.text
    // BOŞ bir parça öncekini silmez: ekler ve hızlı yanıtlar ayrı aktivitede gelebiliyor.
    if (chunk.attachments?.length) fullAttachments = chunk.attachments
    if (chunk.suggestedActions?.length) fullSuggested = chunk.suggestedActions
    setMessages((m) =>
      m.map((msg) =>
        msg.id === replyId
          ? {
              ...msg,
              content: fullText,
              attachments: [...fullAttachments, ...docs],
              suggestedActions: fullSuggested,
            }
          : msg,
      ),
    )
  }
  const hasContent =
    Boolean(fullText) || fullAttachments.length + docs.length > 0 || fullSuggested.length > 0
  const incomplete = (hasContent || sawTransient) && !sawFinal
  // Boş balonu yalnız eksik DE değilse kaldır (eksikse Tekrar dene için kalsın).
  if (!hasContent && !incomplete) {
    setMessages((m) => m.filter((msg) => msg.id !== replyId))
  }
  return { fullText, fullAttachments, fullSuggested, incomplete, replyId }
}
