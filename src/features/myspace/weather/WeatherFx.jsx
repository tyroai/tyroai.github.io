import { useId } from "react"

// Sabit dağılım: yeniden çizimde tanelerin konumu ve ritmi sıçramasın.
// Köşkte ilk 24 tane; köşksüz gökte (`dense`) 40 — düz degradede seyrek kalıyordu.
const SNOWFLAKES = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 41 + 7) % 100,
  size: 1.5 + ((i * 7) % 5) * 0.45,
  duration: 9 + ((i * 13) % 9),
  delay: -((i * 17) % 19),
  sway: 6 + ((i * 11) % 15),
  rest: (i * 29 + 11) % 100,
}))

/**
 * Yağmur iki katman: yakın (112 px karo, hızlı) ve uzak (80 px karo, yavaş, soluk). Satır içi SVG
 * desen — CSS resmi DEĞİL: maske ya da arka plan resmi olunca Chromium süs katmanını sayfanın en
 * büyük içeriği (LCP) sayıyordu; hava verisi gelince çizildiği için soğuk açılış ölçümü 3,3 sn
 * çıkıyordu. SVG şekli LCP adayı değil. Desen kimliği `useId`: kart gizli bir kopyada da çizilebilir.
 */
function Rain() {
  const id = useId()
  return (
    <div className="sky-estate__rain">
      <svg className="sky-estate__rain-layer sky-estate__rain-layer--near" aria-hidden="true">
        <defs>
          <pattern id={`${id}near`} width="112" height="112" patternUnits="userSpaceOnUse">
            <g stroke="#e3effa" strokeLinecap="round" strokeWidth="1">
              <path d="M18 8l-3 18" strokeOpacity=".6" />
              <path d="M66 48l-3 15" strokeOpacity=".45" />
              <path d="M98 12l-3 20" strokeOpacity=".55" />
              <path d="M35 79l-2 14" strokeOpacity=".4" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}near)`} />
      </svg>
      <svg className="sky-estate__rain-layer sky-estate__rain-layer--far" aria-hidden="true">
        <defs>
          <pattern id={`${id}far`} width="80" height="80" patternUnits="userSpaceOnUse">
            <g stroke="#d5e6f4" strokeLinecap="round" strokeWidth=".7" strokeOpacity=".5">
              <path d="M12 20l-1.5 10" />
              <path d="M55 61l-1.5 9" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id}far)`} />
      </svg>
    </div>
  )
}

/**
 * Kartın tamamına yağış ve hava efekti — yağmur (fırtınada şimşekle), kar, sis. Köşk katmanında
 * (`EstateLayer`) fotoğrafın üstünde; köşk kapalıyken de kartın gökyüzünde (`SkyCard`): yağmur
 * yalnız bulut simgesinin altında yağıyordu. Kurallar `estateEffects.css`te (`.sky-estate`
 * kabının değişkenleriyle); başlık ve dip satırında maskeyle hafifler, azaltılmış harekette durur.
 */
export function WeatherFx({ weather, dense = false }) {
  const flakes = dense ? SNOWFLAKES : SNOWFLAKES.slice(0, 24)
  return (
    <>
      {(weather === "rain" || weather === "storm") && <Rain />}
      {weather === "snow" && (
        <div className="sky-estate__snow">
          {flakes.map((flake, i) => (
            <span
              key={i}
              style={{
                "--x": `${flake.x}%`,
                "--size": `${flake.size}px`,
                "--duration": `${flake.duration}s`,
                "--delay": `${flake.delay}s`,
                "--sway": `${flake.sway}px`,
                "--rest": `${flake.rest}%`,
              }}
            >
              <i />
            </span>
          ))}
        </div>
      )}
      {weather === "fog" && (
        <div className="sky-estate__mist">
          <i />
          <i />
          <i />
        </div>
      )}
      {weather === "storm" && <div className="sky-estate__lightning" />}
    </>
  )
}
