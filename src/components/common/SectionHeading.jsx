import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * BÖLÜM BAŞLIĞI — To-Do ("Microsoft To Do · Görevlerin"), Self Servis ("Dynamics 365 · ERP ·
 * Kayıtların") ve Keşfet'in üç sekmesi AYNI dili konuşur: üstte verinin geldiği yeri söyleyen
 * kaş (marka noktası + küçük büyük harf), altında başlık; istenirse yanında sayı, altında tek
 * satır açıklama (`children`). Sayfalar tek elden çıkmış görünsün diye tek tarif burada.
 *
 * Kaş büyük harfle basılıyor: `lang` şart, yoksa Türkçede "i" → "I" olurdu.
 * `titleRef` verilirse başlık odak alabilir (listeye atlayan düğmeler odağı oraya bırakır).
 */
export function Eyebrow({ children, className }) {
  const { locale } = useLocale()
  return (
    <span
      lang={locale}
      className={cn(
        // Blok kutu (`flex w-fit`): satır içi olsaydı gövde satır yüksekliği kaşı ~7 px aşağı iterdi —
        // başlık her sayfada aynı yükseklikte başlasın (UX kapısı ölçer).
        "flex w-fit items-center gap-1.5 text-eyebrow uppercase text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
      {children}
    </span>
  )
}

export function SectionHeading({ id, eyebrow, title, count, titleRef, className, children }) {
  return (
    <div className={cn("min-w-0", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        ref={titleRef}
        tabIndex={titleRef ? -1 : undefined}
        className="mt-2 flex items-baseline gap-2 text-page-title outline-none [overflow-wrap:anywhere]"
      >
        {title}
        {count != null && (
          <span className="text-body font-medium tabular-nums text-muted-foreground">{count}</span>
        )}
      </h2>
      {children}
    </div>
  )
}

/**
 * SAYFA BAŞLIĞI — Keşfet'in kaşlı başlığının sayfa düzeyi (Profilim, Güvenlik, Yardım, Yenilikler):
 * marka noktalı kaş ("Hesabım · Microsoft 365"), altında `h1`, istenirse tek satır açıklama ve
 * sağda (dar kapta altta) eylemler. Ölçüler ortak tokenlardan (`text-page-title`, `text-eyebrow`;
 * `docs/design-tokens.md`): başlık `SectionHeading` ile aynı, sayfalar tek elden.
 */
export function PageHeading({ eyebrow, title, description, actions, id, className }) {
  return (
    <header className={cn("flex flex-wrap items-end gap-x-6 gap-y-3", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 id={id} className="mt-2 text-page-title [overflow-wrap:anywhere]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-[60ch] text-body text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-controls">{actions}</div>
      ) : null}
    </header>
  )
}
