// @azure/msal-react'ın DEMO karşılığı: oturum durumu sahte MSAL örneğinden (demo/shims/msal-browser.js).
import { createContext, useContext, useMemo } from "react"
import { InteractionStatus, isDemoSignedIn } from "./msal-browser.js"

const MsalContext = createContext(null)

export function MsalProvider({ instance, children }) {
  const value = useMemo(
    () => ({ instance, accounts: instance.getAllAccounts(), inProgress: InteractionStatus.None }),
    [instance],
  )
  return <MsalContext.Provider value={value}>{children}</MsalContext.Provider>
}

export function useMsal() {
  return useContext(MsalContext)
}

export function useIsAuthenticated() {
  return isDemoSignedIn()
}

export function useAccount() {
  const ctx = useContext(MsalContext)
  return ctx?.accounts?.[0] ?? null
}

export function AuthenticatedTemplate({ children }) {
  return isDemoSignedIn() ? children : null
}

export function UnauthenticatedTemplate({ children }) {
  return isDemoSignedIn() ? null : children
}

export { MsalContext }
