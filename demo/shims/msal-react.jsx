// @azure/msal-react'ın DEMO karşılığı: oturum her zaman açık.
import { createContext, useContext, useMemo } from "react"
import { InteractionStatus } from "./msal-browser.js"

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
  return true
}

export function useAccount() {
  const ctx = useContext(MsalContext)
  return ctx?.accounts?.[0] ?? null
}

export function AuthenticatedTemplate({ children }) {
  return children
}

export function UnauthenticatedTemplate() {
  return null
}

export { MsalContext }
