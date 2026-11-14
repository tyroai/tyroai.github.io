/**
 * Kubbedeki iğne ve etiketi: `at` kubbe koordinatı, `z` içinde durduğu grubun ölçeği (iğne haritayla
 * kayar ama büyümez). `soft`: ikincil uç (başlangıç); `below`: etiket iğnenin altında.
 */
export function Pin({ at, z, label, soft, pinKey, below }) {
  const tagW = Math.max(34, String(label ?? "").length * 6.4 + 18)
  return (
    <g transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`}>
      {/* İğne ve etiket haritayla kayar ama büyümez. */}
      <g style={{ transform: `scale(${1 / z})` }}>
        <g key={pinKey} className="af-pin" data-soft={soft ? "" : undefined}>
          {!soft && <circle r="13" className="af-pin-ripple" />}
          <circle r={soft ? 8 : 9.5} className="af-pin-halo" />
          <circle r={soft ? 5.4 : 6.2} className="af-pin-ring" />
          <circle r={soft ? 3.6 : 4.2} className="af-pin-dot" />
          {label && (
            <g transform={`translate(0 ${below ? 29 : -29})`}>
              <rect x={-tagW / 2} y="-11" width={tagW} height="22" rx="7" className="af-tag" />
              <text y="4" textAnchor="middle" className="af-tag-text">
                {label}
              </text>
            </g>
          )}
        </g>
      </g>
    </g>
  )
}
