import { useLocale } from "@/hooks/useLocale"
import { clock } from "./format"

/**
 * "+n" düğmesinin listesi: dar sütunda sığmayan çakışan blokların başlığı ve saati; birine basınca
 * ayrıntısı açılır (önce liste kapanır, odak açan düğmeye döner). `items`: takvim öğeleri.
 */
export function MoreList({ items, onOpen }) {
  const { locale } = useLocale()
  return (
    <div className="cal-tip">
      <ul className="cal-tip-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="cal-tip-item"
              data-tone={item.kind}
              style={{ "--hue": item.hue }}
              onClick={(e) => onOpen(item, e.currentTarget)}
            >
              <span className="cal-tip-text">
                <strong data-private="">{item.title}</strong>
                <span className="cal-tip-meta">
                  <bdo dir="ltr" className="cal-tip-time">
                    {clock(item.start, locale)} – {clock(item.end, locale)}
                  </bdo>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
