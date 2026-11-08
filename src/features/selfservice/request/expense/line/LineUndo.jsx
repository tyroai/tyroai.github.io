import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { TEXT_BTN } from "./lineUi"

/**
 * Silinen kalemin yerinde "Kalem 3 silindi · Geri al" (8 sn). Bildirim (toast) değil: açık pencere
 * dışarıyı kilitlediği için bildirimdeki düğmeye ne dokunulabiliyor ne de sekmeyle ulaşılıyor;
 * bu satır pencerenin içinde, klavyeyle de çalışır. Ekran okuyucuya listenin hep çizili canlı
 * bölgesi söyler (`ExpenseForm`): bu satır metniyle birlikte eklendiği için canlı bölge değil.
 */
export function LineUndo({ n, onUndo }) {
  const { t } = useLocale()
  return (
    <p className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground/[0.05] px-4 text-[0.8125rem] text-foreground/80">
      {t("selfService.expense.removed", { n })}
      <button
        type="button"
        onClick={onUndo}
        className={cn(TEXT_BTN, "text-brand-ink hover:bg-brand/[0.08]")}
      >
        {t("selfService.leave.undo")}
      </button>
    </p>
  )
}
