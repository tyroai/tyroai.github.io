import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { parseSub } from "./catalogLogic"

/**
 * Seçili katalog türü adreste (`?sub=`): yenilemede ve paylaşılan bağlantıda aynı tür açılır.
 * `replace`: tür değiştirmek geçmişe adım eklemez (Geri sayfadan çıkar, türler arasında dolaşmaz).
 * Öteki parametrelere (`?tab=catalog`) dokunulmaz.
 */
export function useCatalogSub() {
  const [params, setParams] = useSearchParams()
  const sub = parseSub(params.get("sub"))
  const setSub = useCallback(
    (next) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set("sub", next)
          return p
        },
        { replace: true },
      ),
    [setParams],
  )
  return [sub, setSub]
}
