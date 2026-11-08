import {
  STATUS,
  graphGet,
  graphPatch,
  graphPost as graphRequestPost,
  graphPostNoContent,
  parseGraphDateTime,
  requestGraphScopes,
} from "@/lib/graph"
import { replyHtml } from "./oofModel"
import { isoMinutes } from "./presenceModel"

/**
 * Denetim Merkezi'nin Graph araçları: Teams durumu (`Presence.ReadWrite`) ve Outlook'un otomatik
 * yanıtı (`MailboxSettings.ReadWrite`). İkisi de girişte istenmez (onay duvarı olmasın): belirteç
 * sessizce alınamazsa sonuç "izin gerekli" olur, izin kişinin bastığı düğmeden istenir
 * (`withConsent`). Hiçbiri fırlatmaz: sonuç `STATUS` taşır.
 */
export const PRESENCE_SCOPES = ["Presence.ReadWrite"]
export const OOF_SCOPES = ["MailboxSettings.ReadWrite"]

/** Belirteç sessizce alınamadı (Graph'a hiç gidilmedi): izin istenmeli. */
export const needsConsent = (res) => res?.status === STATUS.denied && !res.httpStatus

/** Kişinin bastığı düğmeden: önce dene, izin gerekiyorsa iste ve bir kez daha dene. */
export async function withConsent(instance, account, scopes, call) {
  const first = await call()
  if (!needsConsent(first)) return first
  const granted = await requestGraphScopes(instance, account, scopes)
  return granted ? call() : first
}

export const readPresence = (instance, account) =>
  graphGet(instance, account, { path: "/me/presence", scopes: PRESENCE_SCOPES, quiet: true })

/** Tercih edilen durum (`activity` aynı adı taşır), `minutes` sonra Teams'in kendisine döner. */
export const setPresence = (instance, account, choice, minutes) =>
  graphPostNoContent(instance, account, {
    path: "/me/presence/setUserPreferredPresence",
    scopes: PRESENCE_SCOPES,
    body: { availability: choice, activity: choice, expirationDuration: isoMinutes(minutes) },
  })

/** Tercihi kaldır: durum yeniden Teams'in kararı (toplantıda meşgul …). */
export const clearPresence = (instance, account) =>
  graphPostNoContent(instance, account, {
    path: "/me/presence/clearUserPreferredPresence",
    scopes: PRESENCE_SCOPES,
    body: {},
  })

/** Otomatik yanıtın ayarı, tarihler çözülmüş: `{ status, start, end, audience }`. */
export async function readOof(instance, account) {
  const res = await graphGet(instance, account, {
    path: "/me/mailboxSettings/automaticRepliesSetting",
    scopes: OOF_SCOPES,
    quiet: true,
  })
  if (res.status !== STATUS.ready) return res
  const s = res.data ?? {}
  return {
    ...res,
    data: {
      status: s.status ?? "disabled",
      start: parseGraphDateTime(s.scheduledStartDateTime),
      end: parseGraphDateTime(s.scheduledEndDateTime),
      audience: s.externalAudience ?? "all",
    },
  }
}

// Saat dilimi karışmasın diye tarihler UTC yazılır (Outlook kendi diliminde gösterir).
const utc = (d) => ({ dateTime: d.toISOString().slice(0, 19), timeZone: "UTC" })

/**
 * Otomatik yanıtı yazar: `status` scheduled (start–end) · alwaysEnabled · disabled. Metinler düz
 * yazıdan HTML'e (`replyHtml`); `audience` kurum dışı: all · contactsOnly · none.
 */
export function saveOof(instance, account, { status, start, end, internal, external, audience }) {
  const setting = { status }
  if (status !== "disabled") {
    setting.internalReplyMessage = replyHtml(internal ?? "")
    setting.externalReplyMessage = replyHtml(external ?? "")
    setting.externalAudience = audience ?? "all"
  }
  if (status === "scheduled") {
    setting.scheduledStartDateTime = utc(start)
    setting.scheduledEndDateTime = utc(end)
  }
  return graphPatch(instance, account, {
    path: "/me/mailboxSettings",
    scopes: OOF_SCOPES,
    body: { automaticRepliesSetting: setting },
  })
}

const CAL_SCOPES = ["Calendars.ReadWrite"]

/**
 * Odak zamanı bloğu (Odak modunun "Takvimde de ayır"ı): meşgul, özel, hatırlatmasız. İzin isteği
 * YOK — Odak modunu izleyen gözlemciden çağrılır, açılır pencere açmamalı; izin anahtar açılırken
 * istenir (`ensureScopes`).
 */
export const createBlock = (instance, account, { start, end, subject }) =>
  graphRequestPost(instance, account, {
    path: "/me/events",
    scopes: CAL_SCOPES,
    body: {
      subject,
      start: utc(start),
      end: utc(end),
      showAs: "busy",
      isReminderOn: false,
      sensitivity: "private",
    },
  })

/** Bloğun bitişini çeker (Odak modu erken kapandı ya da uzadı). */
export const moveBlockEnd = (instance, account, id, end) =>
  graphPatch(instance, account, {
    path: `/me/events/${encodeURIComponent(id)}`,
    scopes: CAL_SCOPES,
    body: { end: utc(end) },
  })

const PROBE = {
  calendar: { scopes: CAL_SCOPES, path: "/me/calendar?$select=id" },
  teams: { scopes: PRESENCE_SCOPES, path: "/me/presence" },
}

/** Anahtar açılırken (kişinin dokunuşu): izin yoksa şimdi iste. Verildiyse `true`. */
export async function ensureScopes(instance, account, name) {
  const probe = PROBE[name]
  const res = await graphGet(instance, account, {
    path: probe.path,
    scopes: probe.scopes,
    quiet: true,
  })
  if (!needsConsent(res)) return res.status === STATUS.ready
  return requestGraphScopes(instance, account, probe.scopes)
}
