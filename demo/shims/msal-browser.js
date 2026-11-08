// @azure/msal-browser'ın DEMO karşılığı: oturum her zaman açık, belirteçler uydurma.
// Uygulamanın kullandığı yüzey kadarını uygular (PublicClientApplication, EventType, LogLevel,
// InteractionStatus, InteractionRequiredAuthError). Hiçbir ağ isteği yapmaz.
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

export class PublicClientApplication {
  constructor(config) {
    this.config = config
  }
  async initialize() {}
  getAllAccounts() {
    return [ACCOUNT]
  }
  getActiveAccount() {
    return ACCOUNT
  }
  getAccount() {
    return ACCOUNT
  }
  setActiveAccount() {}
  async handleRedirectPromise() {
    return null
  }
  async acquireTokenSilent(request) {
    return tokenResult(request)
  }
  async acquireTokenPopup(request) {
    return tokenResult(request)
  }
  async acquireTokenRedirect() {}
  async loginPopup(request) {
    return tokenResult(request)
  }
  async loginRedirect() {}
  async ssoSilent(request) {
    return tokenResult(request)
  }
  // Demoda çıkış anlamsız (oturum hep açık): ana sayfaya dön.
  async logoutRedirect() {
    window.location.assign("/")
  }
  async logoutPopup() {
    window.location.assign("/")
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
