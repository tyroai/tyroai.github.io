/**
 * Logonun küresi. Uygulamanın canlı maskotu (`BrandOrb`) DEĞİL; logonun durağan parçası.
 *
 * İki görünüm, hangisinin çizileceğini çağıran söyler (`useLogoOrb`, Profil › Görünüm):
 * - "renk": uygulamanın KENDİ küresi (Insta paletli maskot, nötr ifade). Maskot çizicisinden bir
 *   kez üretilmiş durağan dosya: `public/brand/tyro-orb.svg`. Çizici (21 KB) giriş paketine
 *   girmesin ve bulanıklık filtrelerinin kimlikleri sayfadaki kopyalar arasında çakışmasın diye
 *   `<image>` ile gömülür.
 * - "obsidyen": siyah cam, çepeçevre leylak kenar ışığı (koyu zeminde küreyi zeminden ayırır);
 *   burada vektör olarak çizilir, filtre yok.
 */
const ORB_SRC = `${import.meta.env.BASE_URL}brand/tyro-orb.svg`

const STYLES = {
  obsidyen: {
    body: [[0, "#4b4b58"], [0.26, "#23232a"], [0.6, "#0e0e12"], [1, "#020203"]],
    depth: "#000000",
    depthOpacity: 0.55,
    glow: "#b79cff",
    shine: 0.45,
    rim: [[0, "#ffffff", 0.95], [0.3, "#e9ddff", 0.55], [0.6, "#b79cff", 0.6], [1, "#f0abfc", 0.95]],
  },
}

/** Göz geometrisi yarıçapa oranlı: iki yuvarlak göz, merkezin biraz altında. */
function eyesOf(cx, cy, r) {
  const k = r / 100
  return { y: cy + 11 * k, r: 12.9 * k, left: cx - 21 * k, right: cx + 23 * k }
}

/** Tek renk sürüm: gözler gerçek delik (`evenodd`), renk `currentColor`. */
function monoPath(cx, cy, r) {
  const e = eyesOf(cx, cy, r)
  const ring = (x, y, q) => `M${x - q} ${y}a${q} ${q} 0 1 0 ${2 * q} 0a${q} ${q} 0 1 0 ${-2 * q} 0Z`
  return `${ring(cx, cy, r)} ${ring(e.left, e.y, e.r)} ${ring(e.right, e.y, e.r)}`
}

/** `id`: çağıranın `useId`'sinden gelen, belge içinde benzersiz önek. */
export function OrbGlyph({ cx, cy, r, id, mono = false, variant = "renk" }) {
  if (mono) return <path d={monoPath(cx, cy, r)} fill="currentColor" fillRule="evenodd" />
  if (variant !== "obsidyen") {
    return <image href={ORB_SRC} x={cx - r} y={cy - r} width={2 * r} height={2 * r} />
  }
  const s = STYLES.obsidyen
  const k = r / 100
  const e = eyesOf(cx, cy, r)
  const stop = ([offset, color, opacity = 1], i) => (
    <stop key={i} offset={offset} stopColor={color} stopOpacity={opacity} />
  )
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" cx={cx - 34 * k} cy={cy - 42 * k} r={172 * k}>
          {s.body.map(stop)}
        </radialGradient>
        <radialGradient id={`${id}-d`} gradientUnits="userSpaceOnUse" cx={cx - 12 * k} cy={cy - 16 * k} r={118 * k}>
          <stop offset="0.62" stopColor={s.depth} stopOpacity="0" />
          <stop offset="1" stopColor={s.depth} stopOpacity={s.depthOpacity} />
        </radialGradient>
        <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={cx + 8 * k} cy={cy + 84 * k} r={62 * k}>
          <stop offset="0" stopColor={s.glow} stopOpacity="0.7" />
          <stop offset="1" stopColor={s.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity={s.shine} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-r`}
          gradientUnits="userSpaceOnUse"
          x1={cx - 70 * k}
          y1={cy - 80 * k}
          x2={cx + 70 * k}
          y2={cy + 80 * k}
        >
          {s.rim.map(stop)}
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-b)`} />
      <g clipPath={`url(#${id}-c)`}>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-g)`} />
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-d)`} />
        <ellipse
          cx={cx - 36 * k}
          cy={cy - 56 * k}
          rx={50 * k}
          ry={25 * k}
          transform={`rotate(-28 ${cx - 36 * k} ${cy - 56 * k})`}
          fill={`url(#${id}-s)`}
        />
      </g>
      <circle cx={cx} cy={cy} r={r - 1.2 * k} fill="none" stroke={`url(#${id}-r)`} strokeWidth={2.4 * k} />
      <circle cx={e.left} cy={e.y} r={e.r} fill="#ffffff" />
      <circle cx={e.right} cy={e.y} r={e.r} fill="#ffffff" />
    </g>
  )
}
