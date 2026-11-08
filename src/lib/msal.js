import { PublicClientApplication, EventType, LogLevel } from "@azure/msal-browser"
import { isInteractionRequired } from "./sessionExpiry"
import { sessionRestored, suspectSession } from "./sessionHealth"
import { clearSessionCaches } from "./sessionCache"

// Redirect URI is derived from window.location.origin + Vite's BASE_URL, so
// it stays correct across:
//   - dev (http://localhost:5173/)
//   - the custom domain (https://tyroai.github.io/)
//   - any future legacy fallback under a subpath
// The Azure AD app registration must list every origin that actually serves
// the SPA in its SPA redirect URI list — the custom domain, plus localhost
// for dev.
function buildOrigin() {
  if (typeof window === "undefined") return "/"
  return window.location.origin + import.meta.env.BASE_URL
}

// The deploy build gets VITE_MSAL_CLIENT_ID from the `CLIENT_ID` repo secret
// and the workflow refuses to build without it. The baked-in fallback (the
// TYRO registration, which tyroai.github.io also uses for now) keeps a
// local `npm run dev` without a .env signing in.
// Note: SPA client IDs are not secrets — they ship in the bundle and are tied to
// allowed redirect URIs in Azure AD.
const TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID || "25885179-367d-4764-87d3-468af9d700f1"
const CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID || "8e97ab9d-c8b9-4257-8c4f-08337b56aae2"

export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: buildOrigin(),
    postLogoutRedirectUri: buildOrigin() + "login",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // localStorage so tokens survive tab close; sessionStorage if you want per-session
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error,
      piiLoggingEnabled: false,
      loggerCallback: () => {},
    },
  },
}

export const COPILOT_STUDIO_SCOPE = "https://api.powerplatform.com/CopilotStudio.Copilots.Invoke"

export const loginRequest = {
  // GroupMember.Read.All is here so the consent prompt at first login also
  // covers the Graph /me/checkMemberGroups fallback in useIsInGroup. Without
  // it, the silent-token-acquisition would throw InteractionRequired and the
  // hook would fail-closed (= no admin tabs even for real admins). Still
  // requires admin consent on the app registration to take effect tenant-wide.
  //
  // `User.Read.All` (useIsUnderManager, manager chain) is deliberately NOT
  // here. It requires admin consent, and an unconsented admin-consent scope
  // in the LOGIN request turns the whole sign-in into an "Approval required"
  // wall — nobody gets into the app at all. The hook asks for it on its own
  // via acquireTokenSilent instead: once admin consent is granted the silent
  // call succeeds tenant-wide with no user prompt, and until then it throws
  // InteractionRequired and the hook fails closed (restricted agent stays
  // locked). Feature degrades; login never breaks. Same reasoning applies to
  // any future admin-consent scope — keep them out of loginRequest.
  //
  // `Calendars.Read` / `Mail.Read` / `Files.Read.All` / `Sites.Read.All` (the
  // header's mail, calendar and files panels) ARE here, and that is not a
  // contradiction of the rule above — but it IS conditional on the tenant
  // grant. None of the four requires admin consent, so they add no prompt and
  // cannot wall sign-in ONCE they are granted on this app registration
  // (8e97ab9d-…, "TYRO"); they were granted on the tyroTrade registration on
  // 2026-08-19 and this is the same tenant. They have to ride the login
  // because a scope the session never carried can only be renewed through a
  // hidden iframe, and third-party-cookie blocking kills that iframe — the
  // panels then say "cannot access" with no way back (measured on mobile in
  // tyroTrade). If any of them is ever revoked in the portal, take it back
  // out of this list before the next deploy.
  scopes: [
    "User.Read",
    "GroupMember.Read.All",
    "openid",
    "profile",
    "email",
    "Calendars.Read",
    "Mail.Read",
    "Files.Read.All",
    "Sites.Read.All",
    // `Mail.Send` (dosya panelinden belge postalama) ve
    // `Calendars.Read.Shared` (başkasının paylaştığı takvimi okuma) — ikisi de
    // yönetici onayı GEREKTİRMİYOR, yani verildikleri anda girişe ek bir istem
    // koymuyorlar. Yukarıdaki dördüyle aynı kapıdan geçmeleri şart: gizli
    // iframe yolu üçüncü taraf çerez kurallarıyla kesiliyor, o yüzden token
    // etkileşimli girişin kendisinden gelmek zorunda.
    "Mail.Send",
    "Calendars.Read.Shared",
    // `Tasks.ReadWrite` (Akışım › Bugünün odağı ↔ Microsoft To Do) — yönetici
    // onayı gerektirmiyor ve 2026-09-29'da "Granted for TYRO" olarak
    // verildi (portal ekran görüntüsüyle teyit edildi). Aynı gerekçe: sessiz
    // yenileme gizli iframe'e düşerse çerez kuralları onu kesiyor.
    "Tasks.ReadWrite",
  ],
  prompt: "select_account",
  extraScopesToConsent: [COPILOT_STUDIO_SCOPE],
}

export const copilotStudioRequest = {
  scopes: [COPILOT_STUDIO_SCOPE],
}

// Dataverse Web API access. Requires the SPA app registration to have
// "Dynamics CRM > user_impersonation" delegated permission (admin consented).
// The scope is the Dataverse environment URL + /user_impersonation.
// Sondaki "/" atılır: yönetim merkezi adresi "/" ile veriyor, yoksa ".com//api/..." olurdu.
export const DATAVERSE_URL = (
  import.meta.env.VITE_DATAVERSE_URL || "https://demo.crm4.dynamics.com"
).replace(/\/+$/, "")
export const dataverseRequest = {
  scopes: [`${DATAVERSE_URL}/user_impersonation`],
}

/**
 * İK Dataverse'i — **AYRI BİR ORTAM**, ayrı kaynak, ayrı token.
 *
 * ⚠️ **`loginRequest`'E EKLENMEZ.** Giriş isteğine konan her kapsam girişin
 * KENDİSİNı riske atar: bir ortam için onay yoksa kullanıcı uygulamaya hiç
 * giremez. Bu kapsam yalnız Tebrikler kartı için, sessizce ve KULLANIM
 * ANINDA istenir; alınamazsa kart kendi boş durumunu çizer, uygulama açılır.
 * (Aynı karar tyroTrade'in freight ortamı için de yazılı.)
 */
export const HR_DATAVERSE_URL = (
  import.meta.env.VITE_HR_DATAVERSE_URL || "https://demo-hr.crm4.dynamics.com"
).replace(/\/+$/, "")
export const hrRequest = {
  scopes: [`${HR_DATAVERSE_URL}/user_impersonation`],
}

export const isMsalConfigured = Boolean(CLIENT_ID)

// sessionStorage flag used ONLY when MSAL isn't configured (mock / dev login).
// Single source of truth shared by App, LoginPage and NavUser.
export const MOCK_LOGGED_IN_KEY = "tyro-logged-in"

export const msalInstance = new PublicClientApplication(msalConfig)

// Initialize the instance and pick up the active account if one exists in cache.
// Must be awaited before any login/account calls.
let initPromise = null
export function ensureMsalInitialized() {
  if (!initPromise) {
    initPromise = msalInstance.initialize().then(() => {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
        msalInstance.setActiveAccount(accounts[0])
      }
    })
  }
  return initPromise
}

// Keep active account in sync with login / logout events
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
    msalInstance.setActiveAccount(event.payload.account)
    sessionRestored()
    // Kendi profil fotoğrafım girişte yeniden sorulur (Office'te değişmiş olabilir).
    import("@/lib/myPhoto")
      .then((m) => m.markPhotoDue(localStorage, event.payload.account.homeAccountId))
      .catch(() => {})
  }
  // Bir token alınamadı: oturumun süresi dolmuş olabilir — sınanır, dolduysa her sayfada tek
  // uyarı (`lib/sessionHealth`, `layout/SessionExpiredBanner`).
  if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE && isInteractionRequired(event.error)) {
    suspectSession(msalInstance)
  }
  if (event.eventType === EventType.LOGOUT_SUCCESS) {
    msalInstance.setActiveAccount(null)
    sessionRestored()
    // Kişisel veri tutan her bellek önbelleği ve depo anahtarı silinir: aynı tarayıcıya giren
    // sonraki kullanıcı öncekinin verisini (yönetici kararı, posta, izinler…) devralmasın.
    // Önbellekler kendini `lib/sessionCache`te kaydeder; burada liste tutulmaz. MSAL bu olayı
    // öteki sekmelere de yayar (localStorage önbelleği), onların belleği de silinir.
    clearSessionCaches()
  }
})
