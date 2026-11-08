import "./recordWindow.css"
import "./recordBody.css"

/**
 * Etiket | değer listesi: ince ayırıcılı satırlar, solda gri etiket, sağda değer (altında soluk
 * `caption`); `wide` satır (not, açıklama) tam satır, etiketin altında, sola hizalı. Satır
 * `{ key, label, value, caption?, wide?, lang? }`. Satır yoksa hiç çizilmez; `title` isteğe bağlı.
 */
export function RecordInfoList({ title, rows, personal = false }) {
  if (!rows?.length) return null
  return (
    <section className="rw-info" data-private={personal ? "" : undefined}>
      {title && <h3 className="rw-section">{title}</h3>}
      <dl className="rw-rows">
        {rows.map((r) => (
          <div key={r.key} className="rw-row" data-wide={r.wide || undefined}>
            <dt>{r.label}</dt>
            <dd lang={r.lang}>
              {r.value}
              {r.caption && <small>{r.caption}</small>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
