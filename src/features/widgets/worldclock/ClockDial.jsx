import { cn } from "@/lib/utils"
import "./worldClock.css"

const TICKS = Array.from({ length: 12 }, (_, i) => i)

/**
 * Analog kadran (SVG, iPhone'un dünya saati gibi): şehirde gündüzse açık, geceyse koyu yüz;
 * akrep ve yelkovan dakikada bir yerini alır (saniye ibresi yok — sürekli hareket boşta işlemci
 * yer, `docs/performance.md`). `home`: ana şehir, paletin renginde ince halka ve göbek.
 */
export function ClockDial({ h, mi, night, home = false, className }) {
  const hour = ((h % 12) + mi / 60) * 30
  const minute = mi * 6
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      data-night={night ? "" : undefined}
      data-home={home ? "" : undefined}
      className={cn("clock-dial", className)}
    >
      <circle cx="50" cy="50" r="47" className="clock-dial__face" />
      {home && <circle cx="50" cy="50" r="49" className="clock-dial__ring" />}
      {TICKS.map((i) => (
        <line
          key={i}
          x1="50"
          y1={i % 3 === 0 ? 8 : 9.5}
          x2="50"
          y2={i % 3 === 0 ? 16 : 13}
          transform={`rotate(${i * 30} 50 50)`}
          className={i % 3 === 0 ? "clock-dial__tick clock-dial__tick--major" : "clock-dial__tick"}
        />
      ))}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        transform={`rotate(${hour} 50 50)`}
        className="clock-dial__hour"
      />
      <line
        x1="50"
        y1="57"
        x2="50"
        y2="16"
        transform={`rotate(${minute} 50 50)`}
        className="clock-dial__minute"
      />
      <circle cx="50" cy="50" r="3.4" className="clock-dial__cap" />
    </svg>
  )
}
