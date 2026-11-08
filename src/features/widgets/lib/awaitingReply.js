import { STATUS, graphGet } from "@/lib/graph"
import { AWAIT_DAYS, AWAIT_MAX, awaitCandidates, hasReply } from "@/features/widgets/lib/mailFollow"

const MAIL = ["Mail.Read"]
const enc = encodeURIComponent
// Posta kutusu başına eşzamanlı istek sınırı 4: konuşmalar dörderli sorulur.
const PARALLEL = 4
/** Konuşmalar her açılışta yeniden sorulmasın: beş dakika. */
export const AWAIT_TTL = 5 * 60_000
/** Görünüm kapalıyken okunacak bir şey yok (kancanın sabit yükleyicisi). */
export const idleAwaiting = async () => ({ status: STATUS.ready, data: { items: [] } })

/**
 * "Yanıt bekleyen" postalar (`Mail.Read`, yeni izin yok): son 14 günde gönderilenler, adaylar
 * ayıklanır (`features/widgets/lib/mailFollow`), her adayın konuşmasına bakılır — gönderimden sonra başkasından
 * posta yoksa yanıt bekliyor. Yalnız kartın bu görünümü açılınca okunur; önbellek
 * `useWidgetData`da (çıkışta silinir).
 */
export async function fetchAwaitingReply(instance, account) {
  const since = new Date(Date.now() - AWAIT_DAYS * 86_400_000).toISOString()
  const sent = await graphGet(instance, account, {
    path: `/me/mailFolders/sentitems/messages?$filter=${enc(`sentDateTime ge ${since}`)}&$orderby=sentDateTime desc&$top=40&$select=id,subject,from,toRecipients,ccRecipients,sentDateTime,conversationId,webLink`,
    scopes: MAIL,
  })
  if (sent.status !== STATUS.ready) return { status: sent.status }
  const list = sent.data.value ?? []
  const me = new Set(
    [account?.username, ...list.map((m) => m.from?.emailAddress?.address)]
      .filter(Boolean)
      .map((a) => a.toLowerCase()),
  )
  const candidates = awaitCandidates(list, me, Date.now())
  const waiting = []
  for (let i = 0; i < candidates.length && waiting.length < AWAIT_MAX; i += PARALLEL) {
    const chunk = candidates.slice(i, i + PARALLEL)
    const threads = await Promise.all(
      chunk.map((c) =>
        graphGet(instance, account, {
          path: `/me/messages?$filter=${enc(`conversationId eq '${c.conversationId.replace(/'/g, "''")}'`)}&$top=25&$select=from,receivedDateTime`,
          scopes: MAIL,
        }),
      ),
    )
    chunk.forEach((c, k) => {
      const res = threads[k]
      // Konuşma okunamadıysa aday gösterilmez: emin olunmadan "yanıt yok" denmez.
      if (res.status === STATUS.ready && !hasReply(res.data.value ?? [], c.sent, me))
        waiting.push(c)
    })
  }
  return { status: STATUS.ready, data: { items: waiting.slice(0, AWAIT_MAX) } }
}
