import { useLocale } from "@/hooks/useLocale"
import { acceptReceipts } from "./expense/acceptReceipts"

/**
 * Fiş dosya girdisinin `onChange`'i: uygun olmayanı eler (`acceptReceipts`: görsel ya da PDF,
 * boyut sınırı; elenen söylenir), kalanları `onAdd`e verir. Girdi boşaltılır: aynı dosya yeniden
 * seçilebilsin. Masrafın fiş sınırını ekleyen taraf (akış) uygular ve sığmayanı söyler.
 */
export function useReceiptTake(onAdd) {
  const { t } = useLocale()
  return (e) => {
    const ok = acceptReceipts(e.target.files, t)
    e.target.value = ""
    if (ok.length) onAdd(ok)
  }
}
