import { useLocale } from "@/hooks/useLocale"

const KEY =
  "inline-flex h-5 min-w-5 items-center justify-center rounded-[0.3125rem] border border-black/[0.1] bg-background px-1 font-sans text-[0.75rem] font-medium leading-none text-foreground/75 shadow-[0_1px_0_rgb(0_0_0/0.06)] dark:border-white/[0.12]"
const mac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")

/** Tuş kapakları ("⌘" "V"): klavye ipucu satırının ve ilk ekranın ortak görünüşü. */
export function Keys({ keys }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.map((k) => (
        <kbd key={k} className={KEY}>
          {k}
        </kbd>
      ))}
    </span>
  )
}

/**
 * Izgaranın altındaki klavye ipucu (yalnız fareli ekranda): Enter alt satır, Tab sonraki hücre,
 * Alt+N (Mac'te ⌥N) yeni kalem, Ctrl/⌘+D üstten kopyala, Ctrl/⌘+V Excel'den yapıştır (satırlar
 * kalem olur, `paste/usePasteRows`), Ctrl/⌘+Enter gözden geçir (gönderim hep önce gözden
 * geçirilir); sonda başlıktaki noktanın anlamı (zorunlu alan).
 */
export function KeyHint() {
  const { t } = useLocale()
  const m = mac()
  const items = [
    [["Enter"], t("selfService.expense.grid.keyDown")],
    [["Tab"], t("selfService.expense.grid.keyNext")],
    [m ? ["⌥", "N"] : ["Alt", "N"], t("selfService.expense.grid.keyAdd")],
    [m ? ["⌘", "D"] : ["Ctrl", "D"], t("selfService.expense.grid.keyCopy")],
    [m ? ["⌘", "V"] : ["Ctrl", "V"], t("selfService.expense.grid.keyPaste")],
    [m ? ["⌘", "Enter"] : ["Ctrl", "Enter"], t("selfService.expense.grid.keyReview")],
  ]
  return (
    <p className="mt-2.5 hidden flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[0.75rem] text-muted-foreground pointer-fine:flex">
      {items.map(([keys, label]) => (
        <span key={keys.join("+")} className="inline-flex items-center gap-1.5">
          <Keys keys={keys} />
          {label}
        </span>
      ))}
      <span className="ms-auto inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-1 rounded-full bg-brand/70" />
        {t("selfService.form.cols.required")}
      </span>
    </p>
  )
}
