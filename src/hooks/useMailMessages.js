import { useCallback, useEffect, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { isMsalConfigured } from "@/lib/msal"
import { graphGet, STATUS } from "@/lib/graph"
import { worstMail } from "@/dev/worstCase/home"
import { onSessionClear } from "@/lib/sessionCache"

function startOfTodayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// In memory only — mail subjects and senders are PII and this browser may be
// shared. See useCalendarEvents for the same reasoning.
const cache = new Map()
const TTL_MS = 2 * 60 * 1000

export function clearMailCache() {
  cache.clear()
}
onSessionClear(clearMailCache)

/**
 * Recent inbox messages plus the unread count.
 *
 * Requires the delegated Graph permission **Mail.Read**, which is NOT granted
 * on the app registration today — so the honest steady state of this hook is
 * `denied`, and the panel says so instead of showing an empty inbox. It starts
 * working the moment an admin grants it, with no code change.
 *
 * (Mail.ReadBasic would also list messages but strips bodyPreview, which is
 * the one-line snippet that makes the panel worth opening.)
 */
export function useMailMessages(count = 10) {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const [state, setState] = useState({ status: "loading", messages: [], unread: 0 })
  const [nonce, setNonce] = useState(0)
  const seq = useRef(0)

  // Derived, not stored — see useCalendarEvents.
  const signedIn = isMsalConfigured && Boolean(account)

  useEffect(() => {
    if (!signedIn) return
    const key = `${account.homeAccountId}::${count}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < TTL_MS && nonce === hit.nonce) {
      // Hydrating from the module cache, which is an external mutable store —
      // reading it during render would be an impure read, and the alternative
      // (useSyncExternalStore) is heavy for a two-minute TTL. Same exemption
      // useIsInGroup takes for its membership cache.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(hit.value)
      return
    }

    let cancelled = false
    const mySeq = ++seq.current
    setState((prev) =>
      prev.messages.length ? prev : { status: "loading", messages: [], unread: 0 },
    )
    ;(async () => {
      const params = new URLSearchParams({
        // importance + toRecipients feed the hover card; from.address keys the
        // sender photo lookup.
        $select:
          "id,subject,from,toRecipients,receivedDateTime,isRead,bodyPreview,hasAttachments,importance,webLink",
        $orderby: "receivedDateTime desc",
        $top: String(count),
      })
      // The badge answers "did anything new come in TODAY?", not "how untidy
      // is my inbox?" — a mailbox with 400 historic unread would otherwise pin
      // the badge at 99+ forever and stop meaning anything. A filtered count
      // query gives the exact number even when today outgrows the list page.
      const countParams = new URLSearchParams({
        $filter: `receivedDateTime ge ${startOfTodayIso()} and isRead eq false`,
        $count: "true",
        $top: "1",
        $select: "id",
      })
      const [listRes, countRes] = await Promise.all([
        graphGet(instance, account, {
          path: `/me/mailFolders/inbox/messages?${params.toString()}`,
          scopes: ["Mail.Read"],
        }),
        graphGet(instance, account, {
          path: `/me/mailFolders/inbox/messages?${countParams.toString()}`,
          scopes: ["Mail.Read"],
        }),
      ])
      if (cancelled || mySeq !== seq.current) return

      if (listRes.status !== STATUS.ready) {
        setState({
          status: listRes.status,
          messages: [],
          unread: 0,
          error: listRes.error,
          detail: listRes.detail,
        })
        return
      }

      const messages = (listRes.data.value ?? []).map((m) => ({
        id: m.id,
        subject: m.subject?.trim() || "",
        from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || "",
        fromAddress: m.from?.emailAddress?.address ?? "",
        to: (m.toRecipients ?? [])
          .map((r) => r.emailAddress?.name || r.emailAddress?.address || "")
          .filter(Boolean),
        importance: m.importance ?? "normal",
        received: m.receivedDateTime ? new Date(m.receivedDateTime) : null,
        isRead: Boolean(m.isRead),
        preview: (m.bodyPreview ?? "").replace(/\s+/g, " ").trim(),
        hasAttachments: Boolean(m.hasAttachments),
        webLink: m.webLink ?? null,
      }))
      // Fall back to counting today's unread on the fetched page if the count
      // query failed — an undercount reads better than no badge at all.
      const todayStart = new Date(startOfTodayIso())
      const unread =
        countRes.status === STATUS.ready && typeof countRes.data["@odata.count"] === "number"
          ? countRes.data["@odata.count"]
          : messages.filter((m) => !m.isRead && m.received && m.received >= todayStart).length

      const value = { status: STATUS.ready, messages, unread }
      cache.set(key, { at: Date.now(), value, nonce })
      setState(value)
    })()

    return () => {
      cancelled = true
    }
  }, [instance, account, signedIn, count, nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstMail() : null
  if (worst) return { ...worst, refresh }
  if (!signedIn) return { status: STATUS.unauthenticated, messages: [], unread: 0, refresh }
  return { ...state, refresh }
}
