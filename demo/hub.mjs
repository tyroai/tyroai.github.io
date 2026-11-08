// Logo yazısının ikinci kelimesi "hub" (tyra·trade, tyra·cbot gibi iki kelimeli kilit: "tyro" kurumsal
// renkte, "hub" paletin renginde). Kaynak logoda h, u ve b yok; harfler "tyro"dan ölçülen değerlerle
// geometrik olarak çizilir: aynı x-yüksekliği ve taban çizgisi, aynı yan duvar kalınlığı (110)
// ve üst/alt çizgi (88), "o" halkasıyla aynı eğim (0,19 ≈ 11°). Yollar doldurulur: nonzero kuralı.
//
//   h  yükselti gövdesi + sol-üstten çıkan kemer + sağ gövde
//   u  sol gövde + alttan kemer (kâse) + tam boy sağ gövde
//   b  yükselti gövdesi + "o" halkası (halkanın solu gövdenin sol kenarına teğet)

const SLANT = 0.19
const PIVOT_Y = 509 // eğim, "o" halkasının merkez satırı etrafında (oval() ile aynı)
const CY = 509 // halkaların merkez satırı
const RY = 298 // dış yarıçap (düşey): üst 211, alt 807 (taşma dahil)
const WALL = 110 // yan duvar
const TOP = 88 // üst/alt çizgi
const XTOP = 221 // düz gövdelerin üstü (x-yüksekliği)
const BASE = 793 // taban çizgisi
const ASC = 40 // yükselti gövdesinin üstü
const W_ARCH = 548 // h ve u'nun dış genişliği
const W_RING = 580 // b'nin halkası ("o" ile aynı)
const K = 0.5523

// "o" halkasının sağ kenarı (dik, eğimsiz) ve harf araları
const START = 2707 + 105 // h'nin sol kenarı
const GAP = 112 // düz gövdeler arası

const skew = ([x, y]) => [x + (PIVOT_Y - y) * SLANT, y]

/** Elips yayı: `a0`dan `a1`e (90°'nin katları, derece); 90° parçalar halinde kübik Bézier. */
function arc(cx, cy, rx, ry, a0, a1) {
  const rad = (d) => (d * Math.PI) / 180
  const P = (d) => [cx + rx * Math.cos(rad(d)), cy + ry * Math.sin(rad(d))]
  const T = (d) => [-rx * Math.sin(rad(d)), ry * Math.cos(rad(d))]
  const dir = a1 > a0 ? 1 : -1
  const segs = []
  for (let a = a0; a !== a1; a += 90 * dir) {
    const b = a + 90 * dir
    const p0 = P(a)
    const p1 = P(b)
    const t0 = T(a)
    const t1 = T(b)
    const f = K * dir
    segs.push({ c: [p0[0] + t0[0] * f, p0[1] + t0[1] * f, p1[0] - t1[0] * f, p1[1] - t1[1] * f, p1[0], p1[1]] })
  }
  return segs
}

const line = (x, y) => ({ l: [x, y] })

/** Alt yol: başlangıç noktası + parçalar. */
const sub = (start, segs) => ({ start, segs })

function nodes(s) {
  const pts = [s.start]
  for (const g of s.segs) pts.push(g.l ?? g.c.slice(4))
  return pts
}

/** İşaretli alan (ekran koordinatı, y aşağı): pozitif = saat yönü. Bézier'ler örneklenir. */
function area(s) {
  const poly = [s.start]
  let cur = s.start
  for (const g of s.segs) {
    if (g.l) {
      cur = g.l
      poly.push(cur)
    } else {
      const [x1, y1, x2, y2, x, y] = g.c
      for (let i = 1; i <= 8; i++) {
        const t = i / 8
        const m = 1 - t
        poly.push([
          m * m * m * cur[0] + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x,
          m * m * m * cur[1] + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y,
        ])
      }
      cur = [x, y]
    }
  }
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return a / 2
}

function reverse(s) {
  const n = nodes(s)
  const segs = []
  for (let i = s.segs.length - 1; i >= 0; i--) {
    const g = s.segs[i]
    const back = n[i]
    segs.push(g.l ? { l: back } : { c: [g.c[2], g.c[3], g.c[0], g.c[1], back[0], back[1]] })
  }
  return { start: n[n.length - 1], segs }
}

/** Yönü sabitle: `sign` +1 saat yönü, -1 ters (delik). */
const orient = (s, sign) => ((area(s) > 0 ? 1 : -1) === sign ? s : reverse(s))

const rect = (x, y, w, h) =>
  sub([x, y], [line(x + w, y), line(x + w, y + h), line(x, y + h)])

/** Kemer (üst yarı halka): soldan sağa dış yay, içten geri. */
function archUpper(x0, w) {
  const cx = x0 + w / 2
  const outer = arc(cx, CY, w / 2, RY, 180, 360)
  const inner = arc(cx, CY, w / 2 - WALL, RY - TOP, 360, 180)
  return sub([x0, CY], [...outer, line(x0 + w - WALL, CY), ...inner])
}

/** Kâse (alt yarı halka). */
function bowlLower(x0, w) {
  const cx = x0 + w / 2
  const outer = arc(cx, CY, w / 2, RY, 0, 180)
  const inner = arc(cx, CY, w / 2 - WALL, RY - TOP, 180, 0)
  return sub([x0 + w, CY], [...outer, line(x0 + WALL, CY), ...inner])
}

/** Tam halka: dış elips (+) ve iç elips (delik, -). */
function ring(x0, w) {
  const cx = x0 + w / 2
  return [
    orient(sub([cx + w / 2, CY], arc(cx, CY, w / 2, RY, 0, 360)), 1),
    orient(sub([cx + w / 2 - WALL, CY], arc(cx, CY, w / 2 - WALL, RY - TOP, 0, 360)), -1),
  ]
}

function letters() {
  const hx = START
  const ux = hx + W_ARCH + GAP
  const bx = ux + W_ARCH + GAP
  const shapes = []
  // h
  shapes.push(rect(hx, ASC, WALL, BASE - ASC), archUpper(hx, W_ARCH), rect(hx + W_ARCH - WALL, CY, WALL, BASE - CY))
  // u
  shapes.push(rect(ux, XTOP, WALL, CY - XTOP), bowlLower(ux, W_ARCH), rect(ux + W_ARCH - WALL, XTOP, WALL, BASE - XTOP))
  // b
  shapes.push(rect(bx, ASC, WALL, BASE - ASC), ...ring(bx, W_RING))
  return { shapes, right: bx + W_RING }
}

const f = (n) => String(Math.round(n * 10) / 10)

/** Alt yolları SVG yol verisine çevirir (eğim burada uygulanır). */
function toPath(shapes) {
  const m = (p) => skew(p).map(f).join(" ")
  let d = ""
  for (const s of shapes) {
    d += `M${m(s.start)}`
    for (const g of s.segs) {
      if (g.l) d += `L${m(g.l)}`
      else d += `C${m([g.c[0], g.c[1]])} ${m([g.c[2], g.c[3]])} ${m([g.c[4], g.c[5]])}`
    }
    d += "Z"
  }
  return d
}

/** { d, right }: yol verisi ve kutunun sağ kenarı (eğim dahil, logo düzlemi birimi). */
export function hubWord() {
  const { shapes, right } = letters()
  // Yönler: dolgular saat yönü (+1), b'nin iç elipsi (son parça) ters (-1, delik).
  const oriented = shapes.map((s, i) => orient(s, i === shapes.length - 1 ? -1 : 1))
  return { d: toPath(oriented), right: Math.ceil(skew([right, ASC])[0]) }
}
