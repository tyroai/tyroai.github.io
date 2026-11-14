/**
 * Hata nedeninin AÇIKLAMA yarısı (saf): koddan tek biçimli neden (`causeOf`), ekranın dilindeki
 * cümle ve Teknik ayrıntı satırları (`causeText`), bildirim notu (`causeNote`) ve Kopyala raporu
 * (`causeReport`). Kodun üretildiği yarı ilk pakette (`lib/errorCause`); bu dosya ilk pakete
 * girmesin diye ayrı durur, ilk paketteki çağıranlar `errorCause`taki tembel girişleri kullanır.
 */
import { ENTITY, errorCause, PRIVILEGE, SERVICES } from "@/lib/errorCause"
import type { CauseCode, Scopes, ServiceId } from "@/lib/errorCause"
import type { Translate } from "@/lib/translate"

/** Neden türü; anlamları `causeOf`un açıklamasında. */
export type CauseKind =
  | "admin"
  | "blocked"
  | "popup"
  | "consent"
  | "reauth"
  | "member"
  | "offline"
  | "network"
  | "denied"
  | "role"
  | "erpRole"
  | "busy"
  | "timeout"
  | "noMailbox"
  | "notFound"
  | "conflict"
  | "tooLarge"
  | "badQuery"
  | "server"
  | "bigAccount"
  | "drive"

/** Hatanın tek biçimli nedeni (`causeOf`). */
export interface Cause {
  kind: CauseKind | null
  service: ServiceId
  status: number | null
  privilege: string | null
  entity: string | null
  scope: string | null
  code: CauseCode
}

/** Teknik ayrıntının bir satırı: [etiket, değer]. */
export type CauseRow = [label: string, value: string]

/** Ekranın dilindeki neden (`causeText`). */
export interface CauseExplained {
  sentence: string | null
  label: string
  code: CauseCode
  rows: CauseRow[]
}

const SERVICE_OF = Object.fromEntries(
  Object.entries(SERVICES).map(([id, name]) => [name, id]),
) as Record<string, ServiceId | undefined>

const POPUP = /user_cancelled|popup_window_error|empty_window_error|monitor_window_timeout/
const REAUTH =
  /interaction_required|login_required|invalid_grant|no_tokens_found|refresh_token_expired|AADSTS(50\d{3}|70\d{3}|700\d{3})/
const NO_MAILBOX =
  /MailboxNotEnabledForRESTAPI|MailboxNotSupportedForRESTAPI|ErrorNonExistentMailbox|ErrorMailboxNotFound|ErrorInvalidUser/
const BUSY = /throttl|TooManyRequests|activityLimitReached|ApplicationThrottled|ErrorServerBusy/i
const TIMEOUT = /timed? ?out|\btimeout\b/i
// F&O'nun rol hatası 403 değil 400/500 gelebiliyor: yetki cümlesi iletide aranır.
const ROLE_TEXT =
  /access (is )?denied|not authori[sz]ed|insufficient|(do|does) not have (the )?(access|permission|privilege|rights)|no (access|permission)|security (role|privilege)|yetki/i

// OneNote'un hesap büyüklüğü kodları (20266 çok bölüm · 10008 / 10013 kütüphanede çok öğe · 30103
// kaynak tüketimi) ve OneDrive'ın hazır olmadığını söyleyen kodlar (30101 · 30104–30106 · 30108):
// HTTP durumundan bağımsız, 400 / 500 / 503 olarak gelebiliyor.
const ONENOTE_BIG = /(^| · )(20266|10008|10013|30103)( · |$)/
const ONENOTE_DRIVE = /(^| · )(30101|30104|30105|30106|30108)( · |$)/

const part = (d: string, word: string) => new RegExp(`(^| · )${word}( · |$)`).test(d)

function kindOf(d: string, service: ServiceId, status: number | null): CauseKind | null {
  if (/AADSTS(90094|90095)/.test(d)) return "admin"
  if (/AADSTS53\d{3}/.test(d)) return "blocked"
  if (POPUP.test(d)) return "popup"
  if (/consent_required|AADSTS6500[14]/.test(d)) return "consent"
  if (REAUTH.test(d)) return "reauth"
  if (/0x80072560/.test(d)) return "member"
  if (part(d, "offline")) return "offline"
  if (part(d, "network")) return "network"
  if (ONENOTE_BIG.test(d)) return "bigAccount"
  if (ONENOTE_DRIVE.test(d)) return "drive"
  if (status === 401) return service === "erp" ? "member" : "reauth"
  if (status === 403) return service === "dataverse" || service === "erp" ? "role" : "denied"
  if (status === 429 || BUSY.test(d)) return "busy"
  if (status === 408 || status === 504 || part(d, "timeout") || TIMEOUT.test(d)) return "timeout"
  if (NO_MAILBOX.test(d)) return "noMailbox"
  if (service !== "graph" && ROLE_TEXT.test(d)) return "erpRole"
  if (status === 404) return "notFound"
  if (status === 409 || status === 412) return "conflict"
  if (status === 413) return "tooLarge"
  if (status === 400) return "badQuery"
  if (status !== null && status >= 500) return "server"
  return null
}

/**
 * Hatanın tek biçimli nedeni: `{ kind, service, status, privilege, entity, scope, code }`; neden
 * yoksa null. `input`: kod (her yerde `detail` diye taşınan kişisel verisiz satır) ya da atılan
 * hata (`source` servisiyle koda çevrilir, `errorCause`). Servis adı olmayan kod eski Self Servis
 * kodudur ve ERP'nindir.
 * `kind`: "admin" (kurum yöneticisinin onayı) · "blocked" (koşullu erişim) · "popup" · "consent"
 * (Microsoft izni yok) · "reauth" (oturum yenilenemedi) · "member" (ortamda kullanıcı yok) ·
 * "offline" · "network" · "denied" (Graph reddetti) · "role" (Dataverse/ERP rolü) · "erpRole" (F&O
 * rolü yetmiyor) · "busy" · "timeout" · "noMailbox" · "notFound" · "conflict" · "tooLarge" ·
 * "badQuery" · "server" (5xx) · "bigAccount" (OneNote hesabı çok büyük: 20266, 10008 …) · "drive"
 * (OneDrive hazır değil: 30105 …) · null (bilinmiyor; yalnız kod görünür).
 */
export function causeOf(
  input: unknown,
  { source = "web", scopes }: { source?: ServiceId; scopes?: Scopes } = {},
): Cause | null {
  const code = typeof input === "string" ? input : input ? errorCause(source, input, scopes) : ""
  if (!code) return null
  const service = SERVICE_OF[code.split(" · ", 1)[0]] ?? "erp"
  const status = Number(/HTTP (\d{3})/.exec(code)?.[1]) || null
  return {
    kind: kindOf(code, service, status),
    service,
    status,
    privilege: PRIVILEGE.exec(code)?.[1] ?? null,
    entity: ENTITY.exec(code)?.[1] ?? null,
    scope: /\bscope ([\w.,]+)/.exec(code)?.[1]?.replaceAll(",", ", ") ?? null,
    code,
  }
}

/**
 * Self Servis ekranının türü: "reauth" (oturum yenilenemedi) orada "consent"tir, çare aynı
 * (Bağlan ile izin penceresi).
 */
export function erpKind(detail: unknown): CauseKind | null {
  const kind = causeOf(String(detail ?? ""))?.kind ?? null
  return kind === "reauth" ? "consent" : kind
}

/**
 * Koddan ekranın dilindeki neden: `{ sentence, label, code, rows }`. Kod yoksa null; tür
 * bilinmiyorsa `sentence` null (yalnız kod görünür). `t`: `useLocale().t`. Bileşende `useCause`.
 */
export function causeText(
  t: Translate,
  detail: CauseCode | null | undefined,
): CauseExplained | null {
  const c = detail ? causeOf(String(detail)) : null
  if (!c || !detail) return null
  const { kind, service, status, privilege, entity, scope } = c
  // Cümle sade: tablo, yetki ve izin adları cümleye değil teknik ayrıntıya (`rows`) girer.
  const sentence = kind
    ? t(`cause.why.${kind}`, {
        service: t(`cause.service.${service}`),
        status: status ?? "",
        entity: "",
        privNote: "",
        scopeNote: "",
      })
    : null
  const rows = (
    [
      service && [t("cause.row.service"), t(`cause.service.${service}`)],
      status && [t("cause.row.http"), String(status)],
      (privilege || scope) && [t("cause.row.missing"), privilege || scope],
      entity && [t("cause.row.entity"), entity],
      [t("cause.row.code"), detail],
    ] as (CauseRow | false | null | 0 | "")[]
  ).filter((row): row is CauseRow => Boolean(row))
  return { sentence, label: t("cause.code"), code: detail, rows }
}

/** Balon ya da bildirim metni: kendi cümlen + neden cümlesi + kod ("Kod (BT'ye iletebilirsin): …"). */
export function withCause(base: string, cause: CauseExplained | null | undefined): string {
  if (!cause) return base
  return [base, cause.sentence, `${cause.label} ${cause.code}`].filter(Boolean).join(" ")
}

/**
 * Başarısız işlemin bildirim açıklaması: neden cümlesi + kod. Hatadan servis adından başka bir
 * şey çıkmıyorsa undefined: bildirim eskisi gibi tek başına çıkar. İlk pakette `causeNoteLazy`.
 */
export function causeNote(
  t: Translate,
  service: ServiceId,
  err: unknown,
  scopes?: Scopes,
): string | undefined {
  const cause = causeText(t, errorCause(service, err, scopes))
  if (!cause || (!cause.sentence && !cause.code.includes(" · "))) return undefined
  return withCause("", cause)
}

/**
 * Kopyala'nın düz metin raporu ("TYRO hata raporu" + satırlar). `extra`: ekranın eklediği
 * satırlar (sayfa, zaman, sürüm).
 */
export function causeReport(t: Translate, cause: CauseExplained, extra: CauseRow[] = []): string {
  return [t("cause.report"), ...[...cause.rows, ...extra].map(([k, v]) => `${k}: ${v}`)].join("\n")
}
