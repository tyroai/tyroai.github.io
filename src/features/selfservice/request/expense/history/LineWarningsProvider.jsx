import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { lineWarnings } from "@/features/selfservice/lib/expenseInsights"
import { useRequestData } from "../../requestData"
import { LineWarningsContext } from "./lineWarningsContext"

/** Kalemlerin uyarılarını (`lineWarnings`) altındaki satırlara ve kartlara verir. */
export function LineWarningsProvider({ rows, children }) {
  const { expenses } = useRequestData() ?? {}
  const { locale } = useLocale()
  const value = useMemo(() => lineWarnings(rows, expenses, locale), [rows, expenses, locale])
  return <LineWarningsContext value={value}>{children}</LineWarningsContext>
}
