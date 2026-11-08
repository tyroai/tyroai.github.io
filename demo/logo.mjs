// Logo yazısını "tyra"dan "tyro"ya çevirir: yol verisinde üç alt yol var (t+y, a, r). Ortadaki 'a'
// atılır, yerine aynı x-yüksekliğinde ve kalınlıkta, italik eğimli bir 'o' halkası konur.
// Yol göreli `m` ile ilerlediği için 'r'nin başlangıcı mutlak koordinata çevrilir.
const SLANT = 0.19 // italik eğim (~11°)

/** Eğik elips (mutlak koordinatlı 4 kübik Bézier). */
function oval(cx, cy, rx, ry) {
  const k = 0.5523
  const skew = ([x, y]) => [Math.round(x + (cy - y) * SLANT), Math.round(y)]
  const pts = [
    [cx + rx, cy],
    [cx + rx, cy + k * ry],
    [cx + k * rx, cy + ry],
    [cx, cy + ry],
    [cx - k * rx, cy + ry],
    [cx - rx, cy + k * ry],
    [cx - rx, cy],
    [cx - rx, cy - k * ry],
    [cx - k * rx, cy - ry],
    [cx, cy - ry],
    [cx + k * rx, cy - ry],
    [cx + rx, cy - k * ry],
    [cx + rx, cy],
  ].map(skew)
  const f = (p) => `${p[0]} ${p[1]}`
  return `M${f(pts[0])}C${f(pts[1])} ${f(pts[2])} ${f(pts[3])}C${f(pts[4])} ${f(pts[5])} ${f(pts[6])}C${f(pts[7])} ${f(pts[8])} ${f(pts[9])}C${f(pts[10])} ${f(pts[11])} ${f(pts[12])}Z`
}

/** Her alt yolun MUTLAK başlangıç noktası (yalnız M/m, C/c, L/l, H/h, V/v, S/s, Q/q, Z/z). */
function subpathStarts(d) {
  const t = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)
  const starts = []
  let i = 0
  let cmd = ""
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const num = () => parseFloat(t[i++])
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++]
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    if (C === "M") {
      const nx = num()
      const ny = num()
      x = rel ? x + nx : nx
      y = rel ? y + ny : ny
      sx = x
      sy = y
      starts.push([x, y])
      cmd = rel ? "l" : "L"
    } else if (C === "Z") {
      x = sx
      y = sy
    } else if (C === "L") {
      const nx = num()
      const ny = num()
      x = rel ? x + nx : nx
      y = rel ? y + ny : ny
    } else if (C === "H") {
      const nx = num()
      x = rel ? x + nx : nx
    } else if (C === "V") {
      const ny = num()
      y = rel ? y + ny : ny
    } else if (C === "C" || C === "S" || C === "Q") {
      const n = C === "C" ? 3 : 2
      for (let k = 0; k < n; k++) {
        const nx = num()
        const ny = num()
        if (k === n - 1) {
          x = rel ? x + nx : nx
          y = rel ? y + ny : ny
        }
      }
    } else {
      throw new Error(`Logo yolunda beklenmeyen komut: ${cmd}`)
    }
  }
  return starts
}

export function tyroWord(d) {
  const pieces = d.split(/(?=[Mm])/)
  const starts = subpathStarts(d)
  if (pieces.length !== 3 || starts.length !== 3) {
    throw new Error(`Logo yolu beklenen biçimde değil (3 alt yol bekleniyordu, ${pieces.length} bulundu)`)
  }
  // 'r' parçasının ilk komutu göreli `m dx dy`: mutlak `M x y`e çevir
  const r = pieces[2].replace(/^[Mm]\s*-?\d*\.?\d+[\s,]*-?\d*\.?\d+/, `M${starts[2][0]} ${starts[2][1]}`)
  const ring = oval(2417, 509, 290, 298) + oval(2417, 509, 190, 216)
  return pieces[0] + r + ring
}
