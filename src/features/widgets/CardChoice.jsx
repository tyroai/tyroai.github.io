import { useEffect, useId, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import "./cardChoice.css"

// Etiket uzunsa (ru) iki satıra kırılır, hap büyür; ikon ezilmez.
const BTN =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8125rem] leading-tight font-semibold transition pointer-coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"

/**
 * Kartın üstünde kısa bir soru (Apple'ın eylem sayfası gibi): başlık, isteğe bağlı açıklama,
 * iki seçenek (ilki birincil) ve Vazgeç. Açılınca odak ilk seçenekte — menüden açıldıysa menü
 * odağı geri verdikten sonra. Esc yalnız odak sorudayken (ya da hiçbir yerde değilken) iptal eder
 * (`onChoose(null)`): üstte açık bir pencere ya da menü varsa Esc onundur; düzenleme kipini
 * kapatmaz. Dar kartta sıkışık düzen, kısa kartta aşağı büyür (`cardChoice.css`). Açılışı
 * tetikleyen tuş basılı kalırsa tekrarı seçim yapmaz. Soru dışarıdan kapanırsa (kart gitti,
 * widget başka yoldan header'a girdi) ve odak boşa düştüyse `onGone` odağı karta verir.
 * Seçenek: `{ key, label, icon }`.
 */
export function CardChoice({ label, title, detail, options, cancelLabel, onChoose, onGone }) {
  const box = useRef(null)
  const first = useRef(null)
  const ids = useId()
  // Seçim işlevi her çizimde yeni; odak ve Esc dinleyicisi yalnız açılışta kurulur.
  const latest = useRef(onChoose)
  const gone = useRef(onGone)
  useEffect(() => {
    latest.current = onChoose
    gone.current = onGone
  })
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        first.current?.focus({ preventScroll: true })
        first.current?.scrollIntoView({ block: "nearest" })
      })
    })
    const onKey = (e) => {
      if (e.key !== "Escape") return
      const at = document.activeElement
      if (at && at !== document.body && !box.current?.contains(at)) return
      e.preventDefault()
      latest.current(null)
    }
    document.addEventListener("keydown", onKey, true)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", onKey, true)
      // Seçimde odağı zaten seçen yer verir; boşa düştüyse (dışarıdan kapandı) karta.
      requestAnimationFrame(() => {
        const at = document.activeElement
        if (!at || at === document.body) gone.current?.()
      })
    }
  }, [])
  return (
    <div
      ref={box}
      role="dialog"
      aria-label={label}
      aria-describedby={detail ? `${ids}-detail` : undefined}
      // Açılışı tetikleyen Enter/Boşluk basılı kalırsa tekrarı seçeneği seçmesin.
      onKeyDownCapture={(e) => {
        if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault()
      }}
      className="card-choice absolute inset-0 z-30 rounded-[1.75rem] bg-background/95 text-foreground shadow-[0_18px_40px_-20px_rgb(15_23_42/0.35)] ring-1 ring-border/60 backdrop-blur-sm"
    >
      <div className="card-choice__body">
        <p className="text-[0.8125rem] font-medium text-foreground/85">{title}</p>
        {detail && (
          <p
            id={`${ids}-detail`}
            className="card-choice__detail max-w-[16rem] text-[0.75rem] text-foreground/70"
          >
            {detail}
          </p>
        )}
        <div className="card-choice__options">
          {options.map((o, i) => (
            <button
              key={o.key}
              ref={i === 0 ? first : undefined}
              type="button"
              onClick={() => onChoose(o.key)}
              className={cn(
                BTN,
                i === 0
                  ? "bg-brand-fill-deep text-brand-on-brand hover:brightness-110"
                  : "border border-border bg-background text-foreground/85 hover:bg-accent",
              )}
            >
              <HugeiconsIcon
                icon={o.icon}
                className="size-4 shrink-0"
                strokeWidth={1.9}
                aria-hidden="true"
              />
              {o.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChoose(null)}
          className="rounded-full px-2 text-[0.75rem] text-foreground/70 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}
