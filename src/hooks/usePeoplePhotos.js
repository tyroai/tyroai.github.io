import { useEffect, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { photoFromBlob } from "@/lib/initialsPhoto"
import { CONSENT_CODES, STATUS, tokenDenied } from "@/lib/graph"
import { isMsalConfigured } from "@/lib/msal"
import { knownNoPhoto, rememberNoPhoto } from "@/lib/noPhotoMemo"
import { fetchPhotoBatch } from "@/lib/photoBatch"
import { onSessionClear } from "@/lib/sessionCache"

/**
 * Profile photos for OTHER people — meeting attendees and organizers.
 *
 * `useMe` already fetches MY photo with User.Read; that scope cannot read
 * anyone else's. Colleagues' photos need `User.ReadBasic.All`, which this
 * hook requests SILENTLY and only silently: the calendar popover mounts in
 * the header on every route, and the header's contract (see src/lib/graph.ts)
 * is "silent or nothing" — an interactive prompt from a widget the user
 * didn't click would be a sign-in wall. If the tenant hasn't consented the
 * scope, every avatar simply falls back to initials, which is the exact
 * behaviour the design asks for ("fotoğraf yoksa ad soyad harf kombini").
 *
 * Cache is a module-level Map, IN MEMORY ONLY. Attendee photos are other
 * people's PII on a possibly shared browser — same rule as the calendar and
 * mail caches, and cleared with them on sign-out (`lib/sessionCache`).
 * Three cache states per address: absent = never tried; string = data URL;
 * null = tried and there is nothing there (404, denied) — don't retry.
 */

const cache = new Map() // "size|lowercased address" -> dataURL | null
const inflight = new Map() // "size|lowercased address" -> true while queued or in a batch
const listeners = new Set()

/** One denied silent-token attempt means every later one fails the same way
 *  this session — remember it instead of asking MSAL again per avatar. */
let scopeUnavailable = false

/** Default size 48px: the largest the 24px row avatars and 28px popup avatars
 *  need at 2× DPR, and small enough that a 10-person meeting stays cheap.
 *  Bigger avatars ask for more (`size`, `lib/peoplePhoto`): a 52px story avatar
 *  drawn from 48px is blurry on a 3× phone screen. The cache key carries the size. */
const slot = (size, address) => `${size}|${address}`

export function clearPeoplePhotoCache() {
  cache.clear()
  inflight.clear()
  scopeUnavailable = false
  notify()
}
onSessionClear(clearPeoplePhotoCache)

function notify() {
  for (const cb of listeners) cb()
}

/** One answer for one address — the same rules as when each photo was its own request. */
async function apply(size, address, res) {
  const at = slot(size, address)
  if (res?.status === STATUS.ready) {
    // Harf resmi (baş harflerin yazıldığı "fotoğraf") null döner: avatar harf çizer.
    cache.set(at, await photoFromBlob(res.blob))
    return
  }
  if (!res) return
  if (tokenDenied(res)) {
    // Only a CONSENT answer latches the session-wide "no photos" flag — the
    // tenant saying no is final for this session. A transient network or
    // server error caches nothing, so a later mount simply retries.
    if (CONSENT_CODES.test(res.error ?? "")) {
      scopeUnavailable = true
      cache.set(at, null)
    }
    return
  }
  // Throttling, server errors and network hiccups are not answers — leave the
  // cache slot empty so the next open retries instead of showing initials all session.
  if (!res.httpStatus || res.httpStatus === 429 || res.httpStatus >= 500) return
  // 404 = no photo set; 403 = blocked by policy. Both mean initials.
  if (res.httpStatus === 404) rememberNoPhoto(address)
  cache.set(at, null)
}

/**
 * Photos asked for in the same render are fetched in ONE Graph batch request (`lib/photoBatch`):
 * a missing photo's 404 comes back inside the batch answer instead of as a red console line per
 * person, and ten avatars cost one request. Bigger sizes fall back to 48 (not every account has a
 * large photo) in a second batch for the 404s only.
 */
const queued = new Map() // size -> Set(address)
let flushQueued = false

function enqueue(instance, account, address, size) {
  const at = slot(size, address)
  if (scopeUnavailable || knownNoPhoto(address)) {
    cache.set(at, null)
    return
  }
  let set = queued.get(size)
  if (!set) queued.set(size, (set = new Set()))
  set.add(address)
  inflight.set(at, true)
  if (flushQueued) return
  flushQueued = true
  // Every effect of the same commit runs before the microtask: they all join one batch.
  queueMicrotask(() => flush(instance, account))
}

async function flush(instance, account) {
  flushQueued = false
  const jobs = [...queued]
  queued.clear()
  for (const [size, set] of jobs) {
    const list = [...set]
    try {
      const results = await fetchPhotoBatch(instance, account, list, size)
      const retry = size === 48 ? [] : list.filter((a) => results.get(a)?.httpStatus === 404)
      if (retry.length) {
        for (const [a, r] of await fetchPhotoBatch(instance, account, retry, 48)) results.set(a, r)
      }
      for (const address of list) await apply(size, address, results.get(address))
    } catch {
      // Network hiccup — cache nothing so a later mount can retry.
    } finally {
      for (const address of list) inflight.delete(slot(size, address))
      notify()
    }
  }
}

/**
 * Photos for a list of addresses. Returns `Map<lowercased address, dataURL>`
 * containing only the addresses that actually have one — callers fall back to
 * initials for the rest. `size`: Graph photo size in px (default 48).
 */
export function usePeoplePhotos(addresses, { size = 48 } = {}) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  // Etki hesabın KİMLİĞİNE bağlı, nesnesine değil: nesne her çizimde yenilenseydi etki her
  // cevaptan sonra yeniden koşar, geçici hatada önbelleğe yazılmayan fotoğrafı tekrar isterdi
  // (cevap → yeniden çizim → istek döngüsü).
  const accountId = account?.homeAccountId ?? null
  const accountRef = useRef(account)
  useEffect(() => {
    accountRef.current = account
  })
  const [, bump] = useState(0)

  // Stable identity for the effect: the set of addresses, not the array.
  const key = (addresses ?? [])
    .map((a) => (a || "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|")

  useEffect(() => {
    const current = accountRef.current
    if (!isMsalConfigured || !accountId || !current || !key) return
    const cb = () => bump((n) => n + 1)
    listeners.add(cb)
    for (const address of key.split("|")) {
      const at = slot(size, address)
      if (cache.has(at) || inflight.has(at)) continue
      enqueue(instance, current, address, size)
    }
    return () => listeners.delete(cb)
  }, [key, size, accountId, instance])

  const out = new Map()
  for (const address of key ? key.split("|") : []) {
    const hit = cache.get(slot(size, address))
    if (hit) out.set(address, hit)
  }
  return out
}
