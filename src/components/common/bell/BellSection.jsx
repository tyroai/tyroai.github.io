import { useId } from "react"

/**
 * Bildirim panelinin bölümü: küçük başlık (ad · sayı · sağda isteğe bağlı eylem) ve altında
 * satırlar. Başlık bölümün adı olur (ekran okuyucu bölümler arasında gezinir).
 */
export function BellSection({ label, count, action, children }) {
  const id = useId()
  return (
    <section className="bn-sec" aria-labelledby={id}>
      <div className="bn-sec-head">
        <h3 id={id} className="bn-sec-label">
          {label}
        </h3>
        {count != null && <span className="bn-sec-count">{count}</span>}
        {action}
      </div>
      {children}
    </section>
  )
}
