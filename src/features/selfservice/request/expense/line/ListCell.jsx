import { cn } from "@/lib/utils"

const SIDE =
  "@[36rem]/line:after:pointer-events-none @[36rem]/line:after:absolute @[36rem]/line:after:inset-y-2.5 @[36rem]/line:after:start-0 @[36rem]/line:after:w-px @[36rem]/line:after:bg-black/[0.06] dark:@[36rem]/line:after:bg-white/[0.08]"
// Etiket ve değer alanın boyunda: iki sütunda hata satırı bir hücreyi uzatınca etiketler hizalı kalır.
const LINE = "flex min-h-10 items-center pointer-coarse:min-h-11"

/**
 * Kalem kartının bir alan satırı (gruplu liste): etiket solda, değer sağda, hata değerin altında.
 * Etiket de alanı açar (`htmlFor`: tarihte ve seçicide düğmeye basar, yazıda odaklanır). Üstteki
 * çizgi soldan içeride (Apple listesi); `side`: iki sütunda sağdaki hücre, araya dikey çizgi.
 * `start`: kalemin ilk alanı (`data-row-start`: yeni kalemde odak buraya gelir). `mark`: etiketin
 * yanında işaret (fişten okunan değerin değneği).
 */
export function ListCell({ id, label, error, start, side, mark = null, className, children }) {
  return (
    <div
      data-xl-cell=""
      data-row-start={start ? "" : undefined}
      className={cn(
        "relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 py-1 pe-2 ps-4 has-[[data-morph-open]]:z-30",
        "before:pointer-events-none before:absolute before:end-0 before:start-4 before:top-0 before:h-px before:bg-black/[0.06] dark:before:bg-white/[0.08]",
        side && SIDE,
        className,
      )}
    >
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={cn(
          LINE,
          "min-w-0 gap-1.5 text-[0.875rem] font-medium pointer-coarse:text-[0.9375rem]",
        )}
      >
        <span className="truncate">{label}</span>
        {mark}
      </label>
      <div className={cn(LINE, "min-w-0 justify-end gap-1")}>{children}</div>
      {error && (
        <p
          id={`${id}-error`}
          className="col-start-2 mt-1 pb-1.5 pe-1 text-end text-[0.75rem] leading-snug text-danger-ink"
        >
          {error}
        </p>
      )}
    </div>
  )
}
