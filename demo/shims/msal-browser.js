// @azure/msal-browser'ın DEMO karşılığı: gerçek Entra yok. İlk ziyarette oturum KAPALIdır ve giriş
// sayfası açılır; "Bağlan" sahte oturumu açar (Ömer Gümüş), çıkış kapatır. Durum localStorage'da
// `demo-signed-in` (veri seti değişse de korunur). Hiçbir ağ isteği yapmaz.
import { ACCOUNT } from "../persona.js"

export const LogLevel = { Error: 0, Warning: 1, Info: 2, Verbose: 3, Trace: 4 }

export const InteractionStatus = {
  Startup: "startup",
  Login: "login",
  Logout: "logout",
  AcquireToken: "acquireToken",
  SsoSilent: "ssoSilent",
  HandleRedirect: "handleRedirect",
  None: "none",
}

export const EventType = {
  INITIALIZE_START: "msal:initializeStart",
  INITIALIZE_END: "msal:initializeEnd",
  ACCOUNT_ADDED: "msal:accountAdded",
  ACCOUNT_REMOVED: "msal:accountRemoved",
  LOGIN_START: "msal:loginStart",
  LOGIN_SUCCESS: "msal:loginSuccess",
  LOGIN_FAILURE: "msal:loginFailure",
  ACQUIRE_TOKEN_START: "msal:acquireTokenStart",
  ACQUIRE_TOKEN_SUCCESS: "msal:acquireTokenSuccess",
  ACQUIRE_TOKEN_FAILURE: "msal:acquireTokenFailure",
  LOGOUT_START: "msal:logoutStart",
  LOGOUT_SUCCESS: "msal:logoutSuccess",
  LOGOUT_FAILURE: "msal:logoutFailure",
}

export class InteractionRequiredAuthError extends Error {
  constructor(errorCode = "interaction_required", errorMessage = "") {
    super(errorMessage || errorCode)
    this.name = "InteractionRequiredAuthError"
    this.errorCode = errorCode
    this.subError = ""
  }
}

const SIGNED_KEY = "demo-signed-in"
const base = () => import.meta.env.BASE_URL

/** Sahte oturum açık mı (localStorage). */
export function isDemoSignedIn() {
  try {
    return window.localStorage.getItem(SIGNED_KEY) === "1"
  } catch {
    return false
  }
}

function signIn() {
  try {
    window.localStorage.setItem(SIGNED_KEY, "1")
  } catch {
    /* depo yok: oturum bu sayfa ömrüyle sınırlı kalır */
  }
}

function signOut() {
  try {
    window.localStorage.removeItem(SIGNED_KEY)
  } catch {
    /* yok */
  }
}

const DEMO_TOKEN = "demo.access.token"

function tokenResult(request) {
  return {
    authority: "https://login.microsoftonline.com/demo",
    uniqueId: ACCOUNT.localAccountId,
    tenantId: ACCOUNT.tenantId,
    scopes: request?.scopes ?? [],
    account: ACCOUNT,
    idToken: "demo.id.token",
    idTokenClaims: ACCOUNT.idTokenClaims,
    accessToken: DEMO_TOKEN,
    fromCache: true,
    expiresOn: new Date(Date.now() + 60 * 60 * 1000),
    tokenType: "Bearer",
    correlationId: "demo",
  }
}

const needSignIn = () => new InteractionRequiredAuthError("no_account_error", "demo: oturum kapalı")

export class PublicClientApplication {
  constructor(config) {
    this.config = config
  }
  async initialize() {}
  getAllAccounts() {
    return isDemoSignedIn() ? [ACCOUNT] : []
  }
  getActiveAccount() {
    return isDemoSignedIn() ? ACCOUNT : null
  }
  getAccount() {
    return isDemoSignedIn() ? ACCOUNT : null
  }
  setActiveAccount() {}
  async handleRedirectPromise() {
    return null
  }
  async acquireTokenSilent(request) {
    if (!isDemoSignedIn()) throw needSignIn()
    return tokenResult(request)
  }
  async acquireTokenPopup(request) {
    return tokenResult(request)
  }
  async acquireTokenRedirect() {}
  // Giriş sayfasındaki "Bağlan": oturumu aç ve Anasayfa'ya git. Sessiz deneme (prompt=none) reddedilir:
  // ilk ziyaretçi giriş sayfasını görür.
  async loginRedirect(request) {
    if (request?.prompt === "none") throw new InteractionRequiredAuthError("login_required")
    signIn()
    window.location.assign(`${base()}myspace`)
  }
  async loginPopup(request) {
    signIn()
    return tokenResult(request)
  }
  async ssoSilent(request) {
    if (!isDemoSignedIn()) throw new InteractionRequiredAuthError("login_required")
    return tokenResult(request)
  }
  // Çıkış: oturumu kapat ve giriş sayfasına dön.
  async logoutRedirect() {
    signOut()
    window.location.assign(`${base()}login`)
  }
  async logoutPopup() {
    signOut()
    window.location.assign(`${base()}login`)
  }
  async clearCache() {}
  addEventCallback() {
    return "demo-callback"
  }
  removeEventCallback() {}
  enableAccountStorageEvents() {}
  disableAccountStorageEvents() {}
  getLogger() {
    const noop = () => {}
    return { error: noop, warning: noop, info: noop, verbose: noop, trace: noop, clone: () => this.getLogger() }
  }
}
