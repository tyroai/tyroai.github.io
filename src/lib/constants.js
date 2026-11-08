// Tenant-scoped constants live here so admin/security-gating IDs stay
// co-located with other Azure AD identifiers (CLIENT_ID, TENANT_ID,
// DATAVERSE_URL in src/lib/msal.js) and so future UI surfaces (an
// admin-only sidebar entry, a "request access" CTA, etc.) can import
// the same ID without each component shipping its own copy.

/**
 * Entra ID security group "BT Tyrotech Business" (39 direct members at
 * provisioning time). Membership in this group gates the admin tabs in
 * /settings (AI Asistanlar / AI Çözümler / İş Uygulamaları). The check
 * lives in src/hooks/useIsInGroup — primary read off
 * `account.idTokenClaims.groups`, fallback to
 * Microsoft Graph `POST /me/checkMemberGroups`.
 */
// Dağıtıma göre değişebilir: VITE_ADMIN_GROUP_ID (bkz. .env.example).
export const ADMIN_GROUP_ID =
  import.meta.env.VITE_ADMIN_GROUP_ID || "e9134608-29de-4768-89e4-cc6a0dd281e2"

/**
 * ⚠️ **AGENT KİLİDİ KALDIRILDI (2026-09-10, istek üzerine).** Burada bir
 * zamanlar iki kural yaşıyordu: "TYRO Trader" yalnız Fatih TYROoğlu veya
 * Kerem Aydın'a (transitif) bağlı çalışanlara, ikinci bir agent yalnız
 * Timur'a bağlı olanlara açıktı; kural Entra ID manager hiyerarşisinden
 * okunuyordu. Artık KATALOGDA AÇIK OLAN HER AGENT HERKESE AÇIK — tek kapı
 * /settings'teki `active` bayrağı.
 *
 * Birlikte silinenler: `TRADER_MANAGERS`, `TRADER_MANAGER_KEYS`,
 * `TIMUR_MANAGER_KEYS`, `TRADER_AGENT_ALIASES`, `TIMUR_AGENT_ALIASES`,
 * `src/lib/agentVisibility.js` ve `AgentAccessToast`.
 *
 * Aşağıdaki tek kayıt YETKİ İÇİN DEĞİL: sohbetteki saniye sayacı bir teşhis
 * aracı ve yalnız BT zincirine çiziliyor (bkz. AgentActivity). Erişimi
 * kısıtlamıyor — kimse bir şeye erişemez hâle gelmiyor, yalnız bir rakam
 * gösterilmiyor.
 */
const TIMUR_KARAMAN = {
  label: "Kerem Aydın",
  // Dataverse systemuser.azureactivedirectoryobjectid üzerinden doğrulandı
  // (Bilgi Teknolojileri Direktörü).
  id: "6675bfc4-8733-4bf3-8a54-e26059188576",
  upn: "can.yildiz@tyrotech.example",
}

/**
 * BT yönetim zincirinin anahtarları (küçük harfe normalize objectId + UPN).
 * Modül seviyesinde bir kez hesaplanır → referansı sabit, effect bağımlılığı
 * olarak güvenli (`useIsUnderManager` diziyi bağımlılık olarak kullanıyor).
 *
 * DİKKAT: eşleşme kullanıcının KENDİSİNİ de kapsar — hook zincire kendi
 * kimliğini de ekler, yani Timur sayacı kendi de görür.
 */
export const IT_MANAGER_KEYS = [TIMUR_KARAMAN].flatMap((m) =>
  [m.id, m.upn].filter(Boolean).map((v) => v.trim().toLowerCase()),
)
